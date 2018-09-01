window.onload=function(){
	var node;
	var margin = {top: 0, right: 0, bottom: 0, left: 0};
	var width = (window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth) - margin.left - margin.right;
	var height = (window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight) - margin.top - margin.bottom;
	//scale
	var csize = d3.scaleLinear().range([0,5]);
	var color = d3.scaleOrdinal(d3.schemeCategory10);
	//sceen
	var svg = d3.select("svg");
	var node,
		net,
		expand = {};
	//other
	var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("link", d3.forceLink().distance(function(l, i) {
		      var n1 = l.source, n2 = l.target;
		    return 30 +
		      Math.min(20 * Math.min((n1.size || (n1.group != n2.group ? n1.group_data.size : 0)),
		                             (n2.size || (n1.group != n2.group ? n2.group_data.size : 0))),
		           -30 +
		           30 * Math.min((n1.link_count || (n1.group != n2.group ? n1.group_data.link_count : 0)),
		                         (n2.link_count || (n1.group != n2.group ? n2.group_data.link_count : 0))),
		           100);
		      //return 150;
		    }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter((width)/2, height/2-100))
	//data
	d3.json("data/index.json").then(function(data) {
		net = network(data, net, getGroup, expand);
		var link = svg.append("g")
      	.attr("class", "links")
	    .selectAll("line")
	    .data(net.links)
	    .enter().append("line")
	      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

		node = svg.append("g")
		.selectAll(".sum")
		.data(net.nodes,function(d) { return d.id; })
		.enter().append("circle")
			.attr("class", "sum")
			.attr("r", function(d){ return csize(d.size);})
			.call(d3.drag()
	          .on("start", dragstarted)
	          .on("drag", dragged)
	          .on("end", dragended));
		simulation.force("charge", d3.forceManyBody().strength(function(){return -Math.max(width,height)/net.nodes.length*20}));
		simulation
		  .nodes(net.nodes)
		  .on("tick", ticked);

		simulation.force("link")
		  .links(net.links);

		

		function ticked() {
		  	node
		        .attr("cx", function(d) { return d.x = Math.max(csize(d.size), Math.min(width - csize(d.size), d.x)); })
		        .attr("cy", function(d) { return d.y = Math.max(csize(d.size), Math.min(height - csize(d.size)-100, d.y)); })
		        //.attr("fill" , function(d){ return color(d.group)});
		        .attr("fill" , function(d){ return color(d.group)});
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

	function getGroup(n) { return n.group; }

	function network(data, prev, index, expand) {
	  expand = expand || {};
	  var gm = {},    // group map
	      nm = {},    // node map
	      lm = {},    // link map
	      gn = {},    // previous group nodes
	      gc = {},    // previous group centroids
	      nodes = [], // output nodes
	      links = []; // output links
	  // process previous nodes for reuse or centroid calculation
	  if (prev) {
	    prev.nodes.forEach(function(n) {
	      var i = index(n), o;
	      if (n.size > 0) {
	        gn[i] = n;
	        n.size = 0;
	      } else {
	        o = gc[i] || (gc[i] = {x:0,y:0,count:0});
	        o.x += n.x;
	        o.y += n.y;
	        o.count += 1;
	      }
	    });
	  }
	  // determine nodes
	  for (var k=0; k<data.nodes.length; ++k) {
	    var n = data.nodes[k],
	        i = index(n),
	        l = gm[i] || (gm[i]=gn[i]) || (gm[i]={group:i, size:0, nodes:[]});
	    if (expand[i]) {
	      // the node should be directly visible
	      nm[n.name] = nodes.length;
	      nodes.push(n);
	      if (gn[i]) {
	        // place new nodes at cluster location (plus jitter)
	        n.x = gn[i].x + Math.random();
	        n.y = gn[i].y + Math.random();
	      }
	    } else {
	      // the node is part of a collapsed cluster
	      if (l.size == 0) {
	        // if new cluster, add to set and position at centroid of leaf nodes
	        nm[i] = nodes.length;
	        nodes.push(l);
	        if (gc[i]) {
	          l.x = gc[i].x / gc[i].count;
	          l.y = gc[i].y / gc[i].count;
	        }
	      }
	      l.nodes.push(n);
	    }
	  // always count group size as we also use it to tweak the force graph strengths/distances
	    l.size += 1;
	  n.group_data = l;
	  }
	  for (i in gm) { gm[i].link_count = 0; }
	  // determine links
	  for (k=0; k<data.links.length; ++k) {
	    var e = data.links[k],
	        u = index(e.source),
	        v = index(e.target);
	  if (u != v) {
	    gm[u].link_count++;
	    gm[v].link_count++;
	  }
	    u = expand[u] ? nm[e.source.name] : nm[u];
	    v = expand[v] ? nm[e.target.name] : nm[v];
	    var i = (u<v ? u+"|"+v : v+"|"+u),
	        l = lm[i] || (lm[i] = {source:u, target:v, size:0});
	    l.size += 1;
	  }
	  for (i in lm) { links.push(lm[i]); }
	  return {nodes: nodes, links: links};
	}
}
