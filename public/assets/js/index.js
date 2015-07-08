(function(){

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
                        url: "/persons/"+$("#searchInput").val(),
                        type: 'GET',
                        success: function (person) {
                            drawGraph(person);
                        }
                    });
                    return false;
                });
            }
        });
    })();

    var drawGraph = function(startingPerson){

        var nodes = [startingPerson];
        var links = [];

        $("#d3").empty();

        var width = $("#d3").width();
        var height = window.innerHeight-100;

        var svg = d3.select("#d3").append("svg").attr("width", width).attr("height", height);

        var rect = svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all").call(d3.behavior.zoom().scaleExtent([1, 1]).on("zoom", zoomed));

        var container = svg.append("g");
        var linksContainer = container.append("g");
        var nodesContainer = container.append("g");

        var force = d3.layout.force()
            .nodes(nodes)
            .links(links)
            .charge(-1000)
            .linkDistance(300)
            .size([width, height])
            .on("tick", tick);


        var link;
        var linktext;
        var node;

        var selectedNode;

        var startGraph = function(){

            var drag = d3.behavior.drag()
                .on("dragstart", dragstart)
                .on("drag", dragmove)
                .on("dragend", dragend);


            //Add New Links
            link = linksContainer.selectAll(".link").data(links);

            var linkEnter = link.enter().append("line")
                .attr("class", "link")
                .style("stroke-width", "4px");

            link.exit().remove();

            linktext = linksContainer.selectAll("g.linklabelholder").data(links);

            var linktextEnter = linktext.enter().append("g")
                .attr("class", "linklabelholder");

            linktextEnter.append("rect")
                .attr("class", "background")
                .attr({
                    "class": "background",
                    x: "-40px",
                    y: "-10px",
                    width: 80,
                    height: 20,
                    "text-anchor": "middle"
                })
                .style("fill", "lightgray");
            linktextEnter.append("text")
                .attr("class", "linklabel")
                .attr("dx", 1)
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .text(function(d) { return d.type });

            linktext.exit().remove();

            //Add New Nodes
            node = nodesContainer.selectAll(".node").data(nodes);

            var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("width", function(d) { return 20; })
                .on("click", getDescription)
                .on("dblclick", dblclick)
                .call(drag);

            nodeEnter.append("title").text(function(d) { return d.name; });
            nodeEnter.append("circle").attr("r", 35);
            nodeEnter.append("text").each(function (d) {
                var arr = d.name.split(" ");
                if (arr != undefined) {
                    for (i = 0; i < arr.length; i++) {
                        d3.select(this).append("tspan")
                            .text(arr[i])
                            .attr("dy", i ? ".9em" : 0)
                            .attr("x", 0)
                            .attr("text-anchor", "middle")
                            .attr("class", "tspan" + i);
                    }
                }
            });
            /*
                .attr("dy", ".3em")
                .style("text-anchor", "middle")
                .text(function(d) { return d.name.split(" ", "\n"); });
            */

            node.exit().remove();
            force.start();
        };

        function dragstart(d, i) {
            force.stop();
        }

        function dragmove(d, i) {
            d.px += d3.event.dx;
            d.py += d3.event.dy;
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            tick();
        }

        function dragend(d, i) {
            d.fixed = true;
            tick();
            force.resume();
        }

        function tick() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

            linktext.attr("transform", function(d) {
                var deg = Math.atan2((d.target.y - d.source.y),(d.target.x - d.source.x)) + Math.PI/2.0;
                deg = deg*180/Math.PI + 270;
                deg = deg%360;
                if(deg > 90)
                    deg = deg - 180;
                return "translate(" + (d.source.x + d.target.x) / 2 + "," + (d.source.y + d.target.y) / 2 + ") rotate("+(deg)+")"; });
        }

        startGraph();

        function dblclick(d) {
            $.ajax({
                url: "/persons/"+ d.name+"/relationships",
                type: 'GET',
                success: function (data) {
                    addNewNodes(data.nodes);
                    addNewLinks(data.links);
                    startGraph();
                }
            });
        }

        function addNewNodes(nodesArray){
            for(var i=0; i<nodesArray.length; i++)
                if(nodes.filter(function(n) {return n.id === nodesArray[i].id;}).length === 0)
                    nodes.push(nodesArray[i]);
        }

        /*
        $(document).on('keyup',function(evt) {
            if (evt.keyCode == 46 && selectedNode != null) {
                var i = 0;
                while (i < links.length) {
                    if ((links[i]['source'] == selectedNode) || (links[i]['target'] == selectedNode)) {
                        links.splice(i, 1);
                    }
                    else i++;
                }
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].name == selectedNode.name) {
                        nodes.splice(i, 1);
                        break;
                    }
                }
                d3.select(".selected").classed("selected", false);
                selectedNode = null;
                startGraph();
            }
        });
        */

        function addNewLinks(linksArray){
            var edges = convertLinksArray(linksArray);
            for(var i=0; i<edges.length; i++)
                if(
                    links.filter(function(n) {
                        return (n.source.name === edges[i].source.name && n.target.name === edges[i].target.name && n.type === edges[i].type);
                    }).length === 0
                )
                    links.push(edges[i]);

            function convertLinksArray(linksArray){
                var edges = [];
                linksArray.forEach(function(e) {
                    var sourceNode = nodes.filter(function(n) {return n.id === e.source;});
                    var targetNode = nodes.filter(function(n) {return n.id === e.target;});

                    if(sourceNode.length !== 0 && targetNode.length !== 0){
                        edges.push({
                            source: sourceNode[0],
                            target: targetNode[0],
                            type: e.type
                        });
                    }
                });
                return edges;
            }
        }

        function zoomed() {
            container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        window.onresize = function(event) {
            width = $("#d3").width();
            height = window.innerHeight-100;
            force.size([width, height]).start();
            svg.attr("width", width).attr("height", height);
            rect.attr("width", width).attr("height", height);
        };

        function getDescription(d){
            d3.select(".selected").classed("selected", false);
            d3.select(this).classed("selected", true);
            if(d.description === undefined) {
                d.description = [];
                $.ajax({
                    url: "/persons/description/"+ d.name,
                    type: 'GET',
                    success: function (data) {
                        if (data.results.bindings.length !== 0) {
                            d.description["title"] = d.name;
                            d.description["description"] = data.results.bindings[0].abstract.value;
                            d.description["image"] = data.results.bindings[0].thumbnail.value;

                        } else {
                            d.description["title"] = "Not Found";
                            d.description["description"] = "";
                            d.description["image"] = "";
                        }
                        $(".title").html(d.description["title"]);
                        $(".description").html(d.description["description"]);
                        $(".image").attr("src", d.description["image"]);
                    }
                });
            }else{
                $(".title").html(d.description["title"]);
                $(".description").html(d.description["description"]);
                $(".image").attr("src", d.description["image"]);
            }
            selectedNode = d;
        }
    };

})();