
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
				listUser(result.results[0].data);
			}
        });	
	}
	
	function listUser(list) {
		for(l in list) {
			tr = $('<tr>');
			tr.data('person', list[l].row[0]);
			td = $('<td>');
			td.text(list[l].row[0].name);
			tr.click(function() {
				p = $(this).data('person');
				console.log(p);
				getUserListOfFriends(p.name);
			});
			tr.append(td);
			//$("#results").children('tbody').append('<tr><td>'+list[l].row[0].name+'</td><td>more data</td></tr>');
			$("#results").children('tbody').append(tr);
		}
		
		
	}
	function getUserListOfFriends(name) {
		
		transaction = {"statements" : [ {    "statement" : "MATCH (ee:Person)-[:KNOWS]-(friends) WHERE ee.name = \""+name+"\" RETURN ee, friends"} ]}; 
		
		
		$.ajax({
            type: "POST",
            url: APIEndPoint + '/data/transaction/commit',
			accepts: { json: "application/json" },
			dataType: 'json',
            data:JSON.stringify(transaction),
			contentType:"application/json",
            success: function (result) 
			{
				console.log(result);
				showUserListOfFriends(result.results[0].data);
				
			}
        });	
	
	}
	
	function showUserListOfFriends(list) {
	$("#fop").html('');
		for(l in list)
		{
			//console.log(list[l].row[1].name);
			li = $('<li>');
			li.text(list[l].row[1].name);
			$("#fop").append(li);
		}

	
	}
	
	
	function createUser(user) {
			// validate user has name, from, learn
			if(user.name==undefined) {
				return false;
			}
			
			
	        $.ajax({
            type: "POST",
            url: APIEndPoint + '/data/node',
			accepts: { json: "application/json" },
			dataType: 'json',
            data:JSON.stringify(user),
            success: function (result) 
			{
				console.log(result);
				
			
			},

            contentType:"application/json"

        });	
	}