d3.json("data/treemap.json", function (error, list) {

    var width = 1200;
    var height = 800;

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(0,0)");

    var root = {
        name: "root",
        children: list
    }

    var cnt = 0;

    function set_id(root) {
        root.id = cnt.toString();
        cnt++;
        if (root.children != null) {
            var tot = root.children.length;
            for (var i = 0; i < tot; i++) {
                set_id(root.children[i]);
            }
        }

    }

    set_id(root);
    console.log(root);

    // draw(root, 400, 400, 400);

    var root_r = 400;
    var root_x = 600;
    var root_y = 400;

    var tot = root.children.length;
    var ang = Math.PI * 2.0 / tot;
    var in_r = root_r * 1.0 / 4;

    var nodes = [
        {
            name: root.name,
            depth: 0,
            r: root_r,
            x: root_x,
            y: root_y,
            father: root.father,
            id: root.id
        }
    ];

    for (var i = 0; i < tot; i++) {
        var cx = root_x + (root_r - in_r) * Math.sin(ang * i + Math.PI / 4.0);
        var cy = root_y + (root_r - in_r) * Math.cos(ang * i + Math.PI / 4.0);
        nodes.push({
            name: root.children[i].name,
            depth: 1,
            r: in_r,
            x: cx,
            y: cy,
            children: root.children[i].children,
            father: root,
            id: root.children[i].id,
        })
    }

    draw(root, root_r, root_x, root_y);

    function draw(root, root_r, root_x, root_y) {

        if (root.depth > 1) {

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].name == root.father.name) {
                    nodes.splice(i, 1);
                    console.log(i);
                    break;
                }
            }
            svg.select("#circle" + root.father.id)
                .on("mouseover", null)
                .on("mouseout", null)
                .on("dblclick", null);

            svg.select("#circle" + root.father.id)
                .remove();

        }

        if (root.depth > 0) {

            var tot = root.children.length;
            var ang = Math.PI * 2.0 / tot;
            var in_r = root_r * 1.0 / 4;
            for (var i = 0; i < tot; i++) {
                var cx = root_x + (root_r - in_r) * Math.sin(ang * i + Math.PI / 4.0);
                var cy = root_y + (root_r - in_r) * Math.cos(ang * i + Math.PI / 4.0);
                nodes.push({
                    name: root.children[i].name,
                    depth: root.depth + 1,
                    r: in_r,
                    x: cx,
                    y: cy,
                    children: root.children[i].children,
                    father: root,
                    class: "new" + i.toString(),
                })
            }

            svg.select("#text" + root.id)
                .remove();
        }


        svg.selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("fill", "rgb(31, 119, 180)")
            .attr("id", function (d) {
                return "circle" + d.id;
            })
            .attr("fill-opacity", function (d) {
                if (d.depth > 0)
                    return "0.4";
                else
                    return "0.1";
            })
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            })
            .attr("r", function (d) {
                return d.r;
            })
            .on("mouseover", function (d, i) {
                d3.select(this)
                    .attr("fill", "yellow");
            })
            .on("mouseout", function (d, i) {
                d3.select(this)
                    .attr("fill", "rgb(31, 119, 180)");
            })
            .on("dblclick", function (d, i) {
                d3.select(this)
                    .attr("fill", "white");
                console.log("here");
                if (d.depth > 1) {
                    draw(d, d.father.r, d.father.x, d.father.y);
                } else if (d.depth == 1) {
                    draw(d, d.r, d.x, d.y);
                }
            });

        svg.selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .attr("font-size", "10px")
            .attr("fill", "black")
            .attr("id", function (d) {
                return "text" + d.id;
            })
            .attr("fill-opacity", function (d) {
                if (d.depth >= 0)
                    return "0.9";
                else
                    return "0.5";
            })
            .attr("x", function (d) {
                return d.x - 20;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("dx", -12)
            .attr("dy", 1)
            .text(function (d) {
                return d.name;
            });
    }
});

