package neo4jingwtpackage.server;

import java.io.File;

import org.neo4j.graphdb.Direction;
import org.neo4j.graphdb.GraphDatabaseService;
import org.neo4j.graphdb.Node;
import org.neo4j.graphdb.Relationship;
import org.neo4j.graphdb.RelationshipType;
import org.neo4j.graphdb.Transaction;
import org.neo4j.graphdb.factory.GraphDatabaseFactory;
import neo4jingwtpackage.client.GreetingService;
import neo4jingwtpackage.shared.FieldVerifier;

import com.google.gwt.user.server.rpc.RemoteServiceServlet;

/**
 * The server-side implementation of the RPC service.
 */
@SuppressWarnings("serial")
public class GreetingServiceImpl extends RemoteServiceServlet implements
GreetingService {

	private static enum RelTypes implements RelationshipType
	{
		KNOWS
	}



	GraphDatabaseService graphDb;
	Node firstNode;
	Node secondNode;
	Relationship relationship;

	public String greetServer(String input) throws IllegalArgumentException {
		// Verify that the input is valid. 
		if (!FieldVerifier.isValidName(input)) {
			// If the input is not valid, throw an IllegalArgumentException back to
			// the client.
			throw new IllegalArgumentException(
					"Name must be at least 4 characters long");
		}

		String serverInfo = getServletContext().getServerInfo();
		String userAgent = getThreadLocalRequest().getHeader("User-Agent");

		// Escape data from the client to avoid cross-site script vulnerabilities.
		input = escapeHtml(input);
		userAgent = escapeHtml(userAgent);
		System.out.println("1");

		result="";



		createDb();
		System.out.println("2");
		removeData();
		System.out.println("3");
		shutDown();






		return result + input + "!<br><br>I am running " + serverInfo
				+ ".<br><br>It looks like you are using:<br>" + userAgent;
	}

	private void shutDown() {
		// TODO Auto-generated method stub
//	       System.out.println();
//	        System.out.println( "Shutting down database ..." );
//	        // START SNIPPET: shutdownServer
	        graphDb.shutdown();
	        // END SNIPPET: shutdownServer

	}

	private void removeData() {
		// TODO Auto-generated method stub
        try ( Transaction tx = graphDb.beginTx() )
        {
            // START SNIPPET: removingData
            // let's remove the data
            firstNode.getSingleRelationship( RelTypes.KNOWS, Direction.OUTGOING ).delete();
            firstNode.delete();
            secondNode.delete();
            // END SNIPPET: removingData

            tx.success();
        }

	}

	private void createDb() {
		deleteFileOrDirectory( new File( DB_PATH ) );
		System.out.println("2.1");
		// START SNIPPET: startDb
		graphDb = new
	     registerShutdownHook( graphDb );
		System.out.println("******************2.2*******************************************");
		registerShutdownHook( graphDb );
		// END SNIPPET: startDb

		// START SNIPPET: transaction
		try ( Transaction tx = graphDb.beginTx() )
		{
			// Database operations go here
			// END SNIPPET: transaction
			// START SNIPPET: addData
			firstNode = graphDb.createNode();
			firstNode.setProperty( "message", "Hello, " );
			secondNode = graphDb.createNode();
			secondNode.setProperty( "message", "World!" );

			relationship = firstNode.createRelationshipTo( secondNode, RelTypes.KNOWS );
			relationship.setProperty( "message", "brave Neo4j " );
			// END SNIPPET: addData

			// START SNIPPET: readData
			result +=firstNode.getProperty( "message" );
			result +=relationship.getProperty( "message" );
			result +=secondNode.getProperty( "message" );
			// END SNIPPET: readData


			// START SNIPPET: transaction
			tx.success();
		}
		// END SNIPPET: transaction

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

	private static void registerShutdownHook( final GraphDatabaseService graphDb )
	{
		// Registers a shutdown hook for the Neo4j instance so that it
		// shuts down nicely when the VM exits (even if you "Ctrl-C" the
		// running application).
		Runtime.getRuntime().addShutdownHook( new Thread()
		{
			@Override
			public void run()
			{
				graphDb.shutdown();
			}
		} );
	}


	/**
	 * Escape an html string. Escaping data received from the client helps to
	 * prevent cross-site script vulnerabilities.
	 * 
	 * @param html the html string to escape
	 * @return the escaped string
	 */
	private String escapeHtml(String html) {
		if (html == null) {
			return null;
		}
		return html.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
				.replaceAll(">", "&gt;");
	}
}
