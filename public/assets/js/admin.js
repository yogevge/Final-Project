(function(){

    var AdminPage = function(){

        var relationships = ['Science','Politics','Family'];
        function AdminPage(){
            //var relationshipBlock =
        }

        var getAllPersons = function(){
            return $.ajax({
                url: "/persons",
                type: 'GET'
            });
        };

        var personsChecklist = function(container,list,inTheList,exclude){
            container.empty();
            list.then(function(data){
                for(var i=0; i<data.length; i++){
                    if(exclude == data[i])
                        continue;

                    var person = $('<div class="checkbox form-inline col-md-12"><label class="col-md-4"><input type="checkbox" name="other[]" value="'+data[i]+'"> '+data[i]+'</label></div>');
                    person.find("input").on("change",function(e){
                        if($(this)[0].checked === true){
                            $(this).parent().parent().append(createRelationshipBlock());
                        }else{
                            $(this).parent().parent().find(".relationship").remove();
                        }
                    });
                    if(inTheList !== undefined && inTheList.filter(function(n) {return n.otherName === data[i];}).length != 0) {
                        var selected = inTheList.filter(function(n) {return n.otherName === data[i];})[0];
                        person.find("input").attr("checked",true);
                        person.append(createRelationshipBlock(selected));
                    }
                    person.appendTo(container);
                }
            });
        };

        var createRelationshipBlock = function(selectedValue){
            console.log(selectedValue);
            var block = $('<div class="relationship"></div>');
            var select = $('<select class="form-control col-md-4" name="otherRelationship[]"></select>');
            var input = $('<input type="text" class="form-control col-md-4" name="otherRelationship[]" placeholder="Other Relationship">');

            for(var i=0;i<relationships.length; i++){
                select.append($('<option value="'+relationships[i]+'">'+relationships[i]+'</option>'));
            }
            select.append($('<option value="Other">Other</option>'));
            block.append(select);

            select.on("change",function(){
                if($(this).val() === "Other"){
                    $(this).attr("name","");
                    block.append(input);
                }else{
                    $(this).attr("name","otherRelationship[]");
                    block.find("input").remove();
                }
            });

            if(selectedValue !== undefined) {
                if (relationships.filter(function (n) {
                        return n === selectedValue.relationship;
                    }).length != 0)
                    select.val(selectedValue.relationship);
                else {
                    select.val("Other");
                    select.attr("name", "");
                    block.append(input);
                    input.val(selectedValue.relationship);
                }
            }

            return block;
        };

        var modifySection = function(name,personsList,relationships){
            var section = $("#modify");
            section.find("span").hide();
            var form = section.find("form");
            form.find(".inputName").html(name);
            form.find(".name").val(name);
            personsChecklist($("#modify-connections"),personsList,relationships,name)
            form.show();

            $("#removePerson").on("click",function(){
                form.attr("action","/admin/remove");
                form.submit();
            });
        };

        return {
            getAllPersons: getAllPersons,
            personsChecklist: personsChecklist,
            modifySection: modifySection
        }
    };

    $(document).ready(function(){
        var adminPage = new AdminPage();

        //Create New Person Section
        var personsList = adminPage.getAllPersons();
        adminPage.personsChecklist($("#create-connections"),personsList);

        (function(){
            var substringMatcher = function(strs) {
                return function findMatches(q, cb) {
                    var matches, substringRegex;
                    matches = [];
                    substrRegex = new RegExp(q, 'i');
                    $.each(strs, function(i, str) {
                        if (substrRegex.test(str)) {
                            matches.push(str);
                        }
                    });

                    cb(matches);
                };
            };

            $.ajax({
                url: "/persons",
                type: 'GET',
                success: function(data) {
                    $('.typeahead').typeahead({
                            hint: true,
                            highlight: true,
                            minLength: 1
                        },
                        {
                            name: 'persons',
                            source: substringMatcher(data)
                        });

                    $("#searchButton").on("click",function(e){
                        $.ajax({
                            url: "/persons/"+$("#searchInput").val()+"/relationship",
                            type: 'GET',
                            success: function (data) {
                                adminPage.modifySection($("#searchInput").val(),personsList,data)
                            //    adminPage.personsChecklist($("#modify-connections"),personsList,data);
                            }
                        });
                        return false;
                    });
                }
            });
        })();

    });

})();