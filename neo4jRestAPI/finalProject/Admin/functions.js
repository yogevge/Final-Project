
	function getAllUsers(){
		transaction = {"statements" : [ {    "statement" : "MATCH (n:`Person`) RETURN n"} ]}; 
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
			}
        });	
	}
	
	function multiselectListUser(list) {
		for(l in list) {
		    $("#example-getting-started").append('<option value="cheese">' + list[l].row[0].name + '</option>');

		}


		$('#example-getting-started').multiselect();
		
	}

	
	function createUser() {
        //creat node

	    var userName = document.getElementById("fullName").value;
	    alert(userName);


	   
	   var statement = { "statements": [{ "statement": "CREATE (tt:Teacher {name:'yogev'});", "resultDataContents": ["row", "graph"], "includeStats": true }] };

			
	        $.ajax({
            type: "POST",
            url: APIEndPoint + 'data/transaction/commit',
			accepts: { json: "application/json" },
			dataType: 'json',
			data: JSON.stringify(statement),
            success: function (result) 
			{
				console.log(result);
				alert("sucsses");
			
			},

            contentType:"application/json"

        });	
	}