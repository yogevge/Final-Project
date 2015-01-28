import java.io.File;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;

import org.neo4j.graphdb.DynamicLabel;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Label;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.ResourceIterator;
import org.neo4j.graphdb.Transaction;
import org.neo4j.graphdb.factory.GraphDatabaseFactory;
import org.neo4j.graphdb.schema.IndexDefinition;
import org.neo4j.graphdb.schema.Schema;


public class main {

	private static final String DB_PATH = "target/neo4j-store-with-new-indexing";

    public static void main( final String[] args )
    {
        System.out.println( "Starting database ..." );
        deleteFileOrDirectory( new File( DB_PATH ) );

        //  startDb
        GraphDatabaseService graphDb = new GraphDatabaseFactory().newEmbeddedDatabase( DB_PATH );


        {
            // createIndex
            IndexDefinition indexDefinition;
            try ( Transaction tx = graphDb.beginTx() )
            {
                Schema schema = graphDb.schema();
                indexDefinition = schema.indexFor( DynamicLabel.label( "User" ) )
                        .on( "username" )
                        .create();
                tx.success();
            }


            try ( Transaction tx = graphDb.beginTx() )
            {
                Schema schema = graphDb.schema();
                schema.awaitIndexOnline( indexDefinition, 10, TimeUnit.SECONDS );
            }

        }

        
        
        {
            //  addUsers
            try ( Transaction tx = graphDb.beginTx() )
            {
                Label label = DynamicLabel.label( "User" );

                // Create some users
                System.out.println( "Users will be created" );
                for ( int id = 0; id < 100000; id++ )
                {
                    Node userNode = graphDb.createNode( label );
                    userNode.setProperty( "username", "user" + id + "@neo4j.org" );
                }
                System.out.println( "Users are created" );
                tx.success();
            }

        }

        {
            //  findUsers
        	System.out.println( "WILL LOOK FOR A CERTAION USER" );
            Label label = DynamicLabel.label( "User" );
            int idToFind = 50000;
            String nameToFind = "user" + idToFind + "@neo4j.org";
            try ( Transaction tx = graphDb.beginTx() )
            {
                try ( ResourceIterator<Node> users =
                        graphDb.findNodesByLabelAndProperty( label, "username", nameToFind ).iterator() )
                {
                    ArrayList<Node> userNodes = new ArrayList<>();
                    while ( users.hasNext() )
                    {
                        userNodes.add( users.next() );
                    }

                    for ( Node node : userNodes )
                    {
                        System.out.println( "The username of user " + idToFind + " is " + node.getProperty( "username" ) );
                    }
                }
            }

        }

        {
            // resource iterator
            Label label = DynamicLabel.label( "User" );
            int idToFind = 45;
            String nameToFind = "user" + idToFind + "@neo4j.org";
            try ( Transaction tx = graphDb.beginTx();
                  ResourceIterator<Node> users = graphDb
                        .findNodesByLabelAndProperty( label, "username", nameToFind )
                        .iterator() )
            {
                Node firstUserNode;
                if ( users.hasNext() )
                {
                    firstUserNode = users.next();
                }
                users.close();
            }

        }

        {
            //  updateUsers
            try ( Transaction tx = graphDb.beginTx() )
            {
                Label label = DynamicLabel.label( "User" );
                int idToFind = 45;
                String nameToFind = "user" + idToFind + "@neo4j.org";

                for ( Node node : graphDb.findNodesByLabelAndProperty( label, "username", nameToFind ) )
                {
                    node.setProperty( "username", "user" + ( idToFind + 1 ) + "@neo4j.org" );
                }
                tx.success();
            }

        }

        {
            // deleteUsers
            try ( Transaction tx = graphDb.beginTx() )
            {
                Label label = DynamicLabel.label( "User" );
                int idToFind = 46;
                String nameToFind = "user" + idToFind + "@neo4j.org";

                for ( Node node : graphDb.findNodesByLabelAndProperty( label, "username", nameToFind ) )
                {
                    node.delete();
                }
                tx.success();
            }
            // 
        }

        {
            // dropIndex
            try ( Transaction tx = graphDb.beginTx() )
            {
                Label label = DynamicLabel.label( "User" );
                for ( IndexDefinition indexDefinition : graphDb.schema()
                        .getIndexes( label ) )
                {
                    // There is only one index
                    indexDefinition.drop();
                }

                tx.success();
            }

        }

        System.out.println( "Shutting down database ..." );
        // shutdownDb
        graphDb.shutdown();

    }

    private static void deleteFileOrDirectory( File file )
    {
        if ( file.exists() )
        {
            if ( file.isDirectory() )
            {
                for ( File child : file.listFiles() )
                {
                    deleteFileOrDirectory( child );
                }
            }
            file.delete();
        }
    }

}
