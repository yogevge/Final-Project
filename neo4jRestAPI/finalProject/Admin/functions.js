
var names = [];

function substringMatcher (strs) {
    return function findMatches(q, cb) {
        var matches, substrRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(strs, function (i, str) {
            if (substrRegex.test(str)) {
                // the typeahead jQuery plugin expects suggestions to a
                // JavaScript object, refer to typeahead docs for more info
                matches.push({ value: str });
            }
        });

        cb(matches);
    };
};


function findUserByName(person_name) {

    var statement = {
        "statements": [{
            "statement": "MATCH (p:Person) WHERE p.name = \"" +person_name+ "\" RETURN p,id(p);",
            "resultDataContents": ["row", "graph"]
        }]
    }

    $.ajax({
        type: "POST",
        url: APIEndPoint + '/data/transaction/commit',
        accepts: { json: "application/json" },
        dataType: 'json',
        data: JSON.stringify(statement),
        contentType: "application/json",
        success: function (result) {
            //console.log(result)
            if (result.results[0].data.length == 0) {
                $("#usersName").text("No user named : " + person_name);
                $("#deleteUserBtn").addClass("hidden");
            } else {
                $("#usersName").text(person_name);
                $("#deleteUserBtn").removeClass("hidden");
            }

        }
    });

}

function deleteUser(name) {
    transaction = { "statements": [{ "statement": "MATCH (n {name: '" + name +"' }) OPTIONAL MATCH (n)-[r]-() DELETE n,r" }] };

    $.ajax({
        type: "POST",
        url: APIEndPoint + '/data/transaction/commit',
        accepts: { json: "application/json" },
        dataType: 'json',
        data: JSON.stringify(transaction),
        contentType: "application/json",
        success: function (result) {
            console.log(result);
        }
    });


}

function getUserListOfFriends(name) {

    transaction = { "statements": [{ "statement": "MATCH (ee:Person)-[:KNOWS]-(friends) WHERE ee.name = \"" + name + "\" RETURN ee, friends" }] };


    $.ajax({
        type: "POST",
        url: APIEndPoint + '/data/transaction/commit',
        accepts: { json: "application/json" },
        dataType: 'json',
        data: JSON.stringify(transaction),
        contentType: "application/json",
        success: function (result) {
            console.log(result);
            showUserListOfFriends(result.results[0].data);

        }
    });

}

function showUserListOfFriends(list) {
    $("#fop").html('');
    for (l in list) {
        //console.log(list[l].row[1].name);
        li = $('<li>');
        li.text(list[l].row[1].name);
        $("#fop").append(li);
    }


}

	function getAllUsers(){
		transaction = {"statements" : [ {  "statement" : "MATCH (n:`Person`) RETURN n,id(n)"} ]}; 
	   $.ajax({
            type: "POST",
            url: APIEndPoint + '/data/transaction/commit',
			accepts: { json: "application/json" },
			dataType: 'json',
            data:JSON.stringify(transaction),
			contentType:"application/json",
            success: function (result) 
			{
				//console.log(result);
				multiselectListUser(result.results[0].data);
				autocomplate();
			}
        });	
	}



	function autocomplate() {
	    //console.log(names);
	    $('#search_person').typeahead({
	        hint: true,
	        highlight: true,
	        minLength: 1
	    },
        {
            name: 'names',
            displayKey: 'value',
            source: substringMatcher(names)
        });
	}


	function multiselectListUser(list) {
       
		for(l in list) {
		    $("#example-getting-started").append('<option value="' + list[l].row[1] + '">' + list[l].row[0].name + '</option>');
		    names[l] = list[l].row[0].name;
		}


		$('#example-getting-started').multiselect();
		
	}

	
	function createUser() {
        //creat node

	    var userName = $("#fullName").val();
	    var propeties = document.getElementById('properties').value
	    var knowRelationshipList = [];

	    $('#example-getting-started :selected').each(function (i, selected)
	    {
	        knowRelationshipList[i] = $(selected).val();
	    });


	    var statement1 = {
	        "statements": [{
	            "statement": "CREATE ( p:Person { name: \"" + userName + "\" }) Return p, id(p);",
	            "resultDataContents": ["row", "graph"]
	        }]
	    }
        
	    var statement2 = {
	        "statements": [{
	            "statement": "CREATE ( p:Person { name: \"" + userName + "\" , " + propeties + " }) Return p,id(p);",
	            "resultDataContents": ["row", "graph"]
	        }]
	    }

	    var statement

	    if ((propeties == ""))    //checks if the admin inserted properties or not if not, stay with default
	    {
	        statement = statement1;
	    }
	    else
	    {
	        statement = statement2;
	    }
			

	        $.ajax({
                type: "POST",
                url: APIEndPoint + '/data/transaction/commit',
			    accepts: { json: "application/json" },
			    dataType: 'json',
			    data: JSON.stringify(statement),
			    contentType:"application/json",
                success: function (result) 
                {

                    userid = result.results[0].data[0].row[1];
                    result.results[0].data[0].row[0];

                    createKnowRelation(userid, knowRelationshipList);
                    console.log(result);
			
                }
            });	
	}


	function createKnowRelation(userid, knowRelationshipList) {
        
	    var statements = { statements: [] }
	    
	    cypher = 'start n1 = node(%p1%), n2= node(%p2%) create (n1)-[:KNOWS]->(n2)';

	    for(i in knowRelationshipList) {
	        statement = cypher.replace('%p1%', userid).replace('%p2%', knowRelationshipList[i]);
	        statements.statements[statements.statements.length] = { statement: statement };
	    }


	    $.ajax({
	        type: "POST",
	        url: APIEndPoint + '/data/transaction/commit',
	        accepts: { json: "application/json" },
	        dataType: 'json',
	        data: JSON.stringify(statements),
	        contentType: "application/json",
	        success: function (result) {
	           
	            //console.log(result);

	        }
	    });


	    //console.log(statements);

	}

