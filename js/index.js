window.onload=function(){
	var node,nodeEnter;
	var margin = {top: 0, right: 0, bottom: 0, left: 0};
	var width = (window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth) - margin.left - margin.right;
	var height = (window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight) - margin.top - margin.bottom;
	//scale
	var csize = d3.scaleLinear().range([0,Math.min(width,height)/150]);
	var color = d3.scaleOrdinal(d3.schemeCategory10);
	//sceen
	var svg = d3.select("svg");
    var range = Math.min(width,height)-20;
	//other
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.index }))
        .force("collide",d3.forceCollide( function(d){return csize(d.size) + 10 }).iterations(16) )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter((width)/2, height/2-100))
        .force("y", d3.forceY(0))
        .force("x", d3.forceX(0));
	//data
	d3.json("data/index.json").then(function(data) {
		var link = svg.append("g")
      	.attr("class", "links")
	    .selectAll("line")
	    .data(data.links)
	    .enter().append("line")
	      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

		node = svg.append("g")
			.selectAll("g.sumg")
		.data(data.nodes,function(d) { return d; });
		nodeEnter = node
		.enter().append("g")
			.attr("class","sumg")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));;
		nodeEnter.append("circle")
			.attr("class", "sum")
			.attr("r", function(d){ return csize(d.size);})
            .attr("fill" , function(d){ return "#eee"});
		nodeEnter
			.filter(function(d,i){if(d.image!=null) return d.image;})
			.append("image")
				.attr("class","img")
				.attr("href",function(d){return d.image;})//"http://marvel-force-chart.surge.sh/marvel_force_chart_img/thanos.png")//function(d){return d.image;})
				.attr('height', function(d){
					return csize(d.size);
				})
				.attr('width', function(d){
                    return csize(d.size);
                })
            .attr("x", function(d) { return -csize(d.size)/2;})
            .attr("y", function(d) { return -csize(d.size)/2;});
        nodeEnter
            .filter(function(d,i){if(d.icon!=null) return d.icon;})
            .append("image")
            .attr("xlink:href",function(d){console.log("baseline-"+d.icon+"-24px.svg"); return "baseline-"+d.icon+"-24px.svg";})
            .attr("class","icon")
            .attr('height', function(d){
                return csize(d.size);
            })
            .attr('width', function(d){
                return csize(d.size);
            })
            .attr("x", function(d) { return -csize(d.size)/2;})
            .attr("y", function(d) { return -csize(d.size)/2;});
		simulation
		  .nodes(data.nodes)
		  .on("tick", ticked);

        simulation.force("link")
            .links(data.links);

		

		function ticked() {
		  	nodeEnter
		        //.attr("cx", function(d) { return d.x = Math.max(csize(d.size), Math.min(width - csize(d.size), d.x)); })
		        //.attr("cy", function(d) { return d.y = Math.max(csize(d.size), Math.min(height - csize(d.size)-100, d.y)); })
            .attr("transform", function(d) {
                d.x = Math.max(csize(d.size), Math.min(width - csize(d.size), d.x));
                d.y = Math.max(csize(d.size), Math.min(height - csize(d.size)-100, d.y));
                return "translate("+d.x+","+d.y+")"; })
            //.attr("cy", function(d) { return d.y = Math.max(csize(d.size), Math.min(height - csize(d.size)-100, d.y)); })
		        //.attr("fill" , function(d){ return color(d.group)});
		        //.attr("fill" , function(d){ return "#eee"});
		    link
		        .attr("x1", function(d) { return d.source.x; })
		        .attr("y1", function(d) { return d.source.y; })
		        .attr("x2", function(d) { return d.target.x; })
		        .attr("y2", function(d) { return d.target.y; });
		  }
	});
	function dragstarted(d) {
	  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	  d.fx = d.x;
	  d.fy = d.y;
	}

	function dragged(d) {
	  d.fx = d3.event.x;
	  d.fy = d3.event.y;
	}

	function dragended(d) {
	  if (!d3.event.active) simulation.alphaTarget(0);
	  d.fx = null;
	  d.fy = null;
	}
}
