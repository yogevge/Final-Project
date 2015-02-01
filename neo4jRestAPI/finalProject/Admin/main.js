var person_name;

$(document).ready(function () {

  	//CreateUser(user);
	getAllUsers();
  
	$("#search_btn").click(function (e) {
	    e.preventDefault();
	    person_name = $("#search_person").val();
	    findUserByName(person_name);
	    getUserListOfFriends(person_name);

        console.log(person_name);


	});


	$('#deleteUserBtn').click(function (e) {
	    e.preventDefault();
	    if (confirm("Are you sure you'd like to delete " + person_name + "?")) {
	        deleteUser(person_name);
	    }
	    setTimeout(function () {
	        location.reload();
	    }, 250);

	});


	$('#create_user').click(function (e) {
	    e.preventDefault();
	    createUser();
	    setTimeout(function () {
	        location.reload();
	    }, 500);
	   
	});

  });