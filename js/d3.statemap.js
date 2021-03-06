var statemap_width = 600,
    statemap_height = 500;


var state_svg = d3.select("div.state-map")
	  .append("svg")
      .attr("width", statemap_width)
      .attr("height", statemap_height)
      .attr("class", "svg-state-map");

var state_projection = d3.geo.albersUsa()
    .scale(700)
    .translate([statemap_width / 2, statemap_height / 2]);

var state_path = d3.geo.path()
    .projection(state_projection);

var dmap_svg = d3.select("div.density-map")
    .append("svg")
      .attr("width", statemap_width)
      .attr("height", statemap_width);
var dmap_g = dmap_svg.append("g");

var csv;
var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
      return "<span class=\"tooltip-text\"><strong>State: </strong></span>" + csv[d.oid].State + "<br><span class=\"tooltip-text\"><strong>Coefficient: </strong></span>" + parseFloat(csv[d.oid].coefficient).toFixed(2);
    });
state_svg.call(tip);
    queue()
    .defer(d3.json, "us2.json")
    .defer(d3.csv, "Statecoefficients.csv")
    .await(regionmap);

var x = d3.scale.linear()
    .domain([1, 400])
    .range([1, 200]);

var xAxis = d3.svg.axis()
    .scale(x)
    .tickValues([1, 100, 200, 300, 400])
    .orient("bottom");

var bar_value = d3.scale.linear()
      .domain([360, 560])
      .rangeRound([1, 400]);

var statecolor = d3.scale.linear()
    .domain([-1, 1])
    .range(["yellow", "green"]);

function regionmap(error, us, sc){
  csv = sc;
    var region = [null, 3, 0, null, 1, 3, 0, null, 1, 4, 4, 4, 3, 3,
              null, 0, 1, 2, 2, 2, 2, 3, 3, 4, 4, 4, 2, 2, 3, 2,
              1, 2, 1, 4, 4, 1, 4, 3, 2, 2, 3, 0, 4, null, 4, 3,
              2, 3, 3, 1, 4, 3, null, 0, 3, 2, 1 ];
  var name = ["pacific", "mountain", "midwest", "south", "northeast"];
  var move = [[-25, -15],[0, 0], [20, -10], [20, 15], [40, -10]];
  var darray = [[],[],[],[],[]];
  us = topojson.feature(us, us.objects.states).features;
  us = us.filter(function(d){
    return d.id > 0 && d.id < 57;
  });
  us.sort(function(a, b){return a.id-b.id});

  dmap_g.selectAll("path")
    .data(us)
    .enter().append("path")
    .attr("d", state_path)
    .attr("class", "region-map")
    .attr("id", function(d){ return "state"+d.id;});

  us.forEach(function(d, i){
    d["oid"] = i;
    darray[region[d.id]].push(d);
  });
  darray.forEach(function(states, i){
    state_svg.append("g").attr("class", name[i])
    .selectAll("path")
    .data(states)
    .enter().append("path")
    .attr("d", state_path)
    .attr("class", "region-map")
    .attr("id", name[i])
    .attr("transform", function(d) {
      var index = region[d.id],
          x = move[index][0],
          y = move[index][1];

      return "translate(" + x + "," + y + ")";
    })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);
  });

  var r = 10;
  var sc2 = sc.slice();
  sc2.sort(function(a, b){return a.hospital_number-b.hospital_number});
  var dragbar = d3.behavior.drag()
    .on("drag", movecircle);

  dmap_svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(" + statemap_width*0.6 + "," + statemap_height*0.9 + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "caption")
    .attr("y", -15)
    .text("Number of hospital");

  var circle = dmap_svg.append("circle")
    .attr("id", "handle")
    .attr("cx", statemap_width*0.6)
    .attr("cy", statemap_height*0.9)
    .attr("r", r)
    .attr("fill", "#92D400")
    .call(dragbar);

    dmap_svg.append("rect")
    .attr("class", "missing-lengend")
    .attr("width", 10)
    .attr("height", 10)
    .attr("x", 455)
    .attr("y", 75)
    dmap_svg.append("text")
    .attr("x", 475)
    .attr("y", 85)
    .text("Missing value");

  function movecircle(d) {
    var x = Math.max(statemap_width*0.6, Math.min(statemap_width*0.6+200, d3.event.x));
    d3.select(this)
      .attr("cx", x);
    var value = bar_value(x);
    sc2.forEach(function(d){
      if (d.hospital_number <= value) {
        d3.select("#state" + d.id)
          .attr("fill", function(){
            if (d.coefficient === '-') return "#FFF";
            return statecolor(d.coefficient);
          })
          .attr("class", "region-map-selected");
      }
      else {
        d3.select("#state" + d.id)
          .attr("class", "region-map");
      }
    });

  }
}


