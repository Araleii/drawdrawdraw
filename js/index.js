d3.json("data/treemap.json", function (error, list) {

    var width = 1200;
    var height = 800;

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(0,0)");


    //          temp_layer -> list_node
    // root ->  temp_layer -> list_node
    //          temp_layer -> list_node

    var root = {
        name: "",
        children: list
    };

    console.log(root);

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
            id: root.id,
            show: 1
        }
    ];

    for (var i = 0; i < tot; i++) {
        var cx = root_x + (root_r - in_r) * Math.sin(ang * i + Math.PI / 4.0);
        var cy = root_y + (root_r - in_r) * Math.cos(ang * i + Math.PI / 4.0);
        nodes.push({
            name: "",
            depth: 1,
            r: in_r,
            x: cx,
            y: cy,
            id: root.children[i].id,
            node: root,
            show: 1
        })
    }

    for (var i = 0; i < tot; i++) {
        var cx = root_x + (root_r - in_r) * Math.sin(ang * i + Math.PI / 4.0);
        var cy = root_y + (root_r - in_r) * Math.cos(ang * i + Math.PI / 4.0);
        nodes.push({
            name: root.children[i].name,
            depth: 2,
            r: in_r,
            x: cx,
            y: cy,
            base: nodes[i + 1],
            id: root.children[i].id,
            node: root.children[i],
            show: 1
        })
    }

    for (var i = 1; i <= tot; i++) {
        nodes[i].children = [nodes[i + tot]];
    }

    draw(root, root_r, root_x, root_y);

    function draw(root, root_r, root_x, root_y) {

        if (root.depth > 1) {

            var nodes_cnt = nodes.length;
            var base = root.base;

            for (var i = 0; i < nodes_cnt; i++) {
                for (var j = 0; j < base.children.length; j++) {
                    if (nodes[i].name == base.children[j].name) {
                        //nodes.splice(i, 1);
                        //i--;
                        //nodes_cnt--;
                        nodes[i].name = "";
                        nodes[i].show = 0;
                        break;
                    }
                }
            }

            for (var i = 0; i < base.children.length && false; i++) {
                svg.selectAll("#text" + base.children[i].id)
                    .remove();
                svg.selectAll("#circle" + base.children[i].id)
                    .remove();
            }

            base.children = [];
            var tot = root.node.children.length;
            var ang = Math.PI * 2.0 / tot;
            var in_r = root_r * 1.0 / 4;
            for (var i = 0; i < tot; i++) {
                var cx = root_x + (root_r - in_r) * Math.sin(ang * i + Math.PI / 3.0);
                var cy = root_y + (root_r - in_r) * Math.cos(ang * i + Math.PI / 3.0);
                var obj = {
                    name: root.node.children[i].name,
                    depth: root.depth + 1,
                    r: in_r,
                    x: cx,
                    y: cy,
                    base: base,
                    id: root.node.children[i].id,
                    node: root.node.children[i],
                    show: 1,
                };
                nodes.push(obj);
                base.children.push(obj)
            }
        } else if (root.depth == 1) {

        }

        svg.selectAll('*')
            .remove();

        svg.selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("fill", "rgb(31, 119, 180)")
            .attr("id", function (d) {
                return "circle" + d.id;
            })
            .attr("fill-opacity", function (d) {
                if (d.show == 1) {
                    if (d.depth > 1)
                        return "0.4";
                    else
                        return "0.1";
                } else {
                    return "0.0";
                }
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
            .on("dblclick", function (d, i) {
                if (d.node.children != null && d.show == 1) {
                    if (d.depth > 1) {
                        draw(d, d.base.r, d.base.x, d.base.y);
                    }
                    if (d.depth == 1) {

                    }
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
                if (d.depth >= 2)
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

