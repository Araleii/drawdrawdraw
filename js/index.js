d3.json("data/treemap.json", function (error, list) {

    var width = 1200;
    var height = 900;

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

    var cnt = 0;

    function set_id(root) {
        root.id = cnt.toString();
        cnt++;
        if (root.children != null) {
            var tot = root.children.length;
            for (var i = 0; i < tot; i++) {
                root.children[i].father = root;
                set_id(root.children[i]);
            }
        }

    }

    set_id(root);
    console.log(root);

    var root_r = 400;
    var root_x = 600;
    var root_y = 450;

    var tot = root.children.length;
    var ang = Math.PI * 2.0 / tot;
    var in_r = root_r * 0.2;

    var nodes = [
        {
            name: root.name,
            depth: 0,
            r: root_r * 1.08,
            x: root_x,
            y: root_y,
            father: root.father,
            id: root.id,
            show: 1,
            z_index: -2,
        }
    ];

    for (var i = 0; i < tot; i++) {
        var cx = root_x + (root_r - in_r) * 1.1 * Math.sin(ang * i + Math.PI / 4.0);
        var cy = root_y + (root_r - in_r) * 0.9 * Math.cos(ang * i + Math.PI / 4.0);
        nodes.push({
            name: "",
            depth: 1,
            r: in_r,
            x: cx,
            y: cy,
            id: -1,
            node: root,
            show: 1,
            z_index: -2,
        })
    }

    for (var i = 0; i < tot; i++) {
        var cx = root_x + (root_r - in_r) * 1.1 * Math.sin(ang * i + Math.PI / 4.0);
        var cy = root_y + (root_r - in_r) * 0.9 * Math.cos(ang * i + Math.PI / 4.0);
        nodes.push({
            name: root.children[i].name,
            depth: 2,
            r: in_r,
            x: cx,
            y: cy,
            base: nodes[i + 1],
            id: root.children[i].id,
            node: root.children[i],
            show: 1,
            z_index: 1,
        })
    }

    for (var i = 1; i <= tot; i++) {
        nodes[i].children = [nodes[i + tot]];
    }

    // These 6 variable below are for draw lines
    var xmlhttp;
    var qs;
    var shown_nodes;
    var center;
    var segs;
    // var segs_drawn = false; //is segs already be drawn

    // for all text
    var text_data = [];

    draw(root, root_r, root_x, root_y);

    function draw(root, root_r, root_x, root_y) {

        if (root.depth > 1 && root.show == 1) {

            var nodes_cnt = nodes.length;
            var base = root.base;
            if (base.name != "") {
                base.name += ":";
            }
            base.name += root.name;


            for (var i = 0; i < nodes_cnt; i++) {
                for (var j = 0; j < base.children.length; j++) {
                    if (nodes[i].id == base.children[j].id) {
                        //nodes.splice(i, 1);
                        //i--;
                        //nodes_cnt--;
                        nodes[i].name = "";
                        nodes[i].show = 0;
                        nodes[i].z_index = 0;
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
            var has_drawn = false;

            //find if already exist
            for (var i = 0; i < nodes_cnt; i++) {
                for (var j = 0; j < tot; j++) {
                    if (nodes[i].id == root.node.children[j].id) {
                        has_drawn = true;
                        nodes[i].name = root.node.children[j].name;
                        nodes[i].show = 1;
                        nodes[i].z_index = 1;
                        base.children.push(nodes[i]);
                    }
                }
            }

            // if has not been drew, add new nodes 
            if (!has_drawn) {
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
                        z_index: 1,
                    };
                    nodes.push(obj);
                    base.children.push(obj);
                }
            }
        } else if (root.depth == 2 && root.show == 0) {
            var nodes_cnt = nodes.length;
            var base = root.base;

            for (var i = 0; i < nodes_cnt; i++) {
                for (var j = 0; j < base.children.length; j++) {
                    if (nodes[i].id == base.children[j].id) {
                        //nodes.splice(i, 1);
                        //i--;
                        //nodes_cnt--;
                        nodes[i].name = "";
                        nodes[i].show = 0;
                        nodes[i].z_index = 0;
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

            var f = base.children[0].node.father.father;
            var now = f.children;
            // if it is the root of the total tree, just use the son.
            if (f.id == 0) {
                now = [base.children[0].node.father];
            }
            var tot = now.length;

            var has_colon = false;
            for (var i = base.name.length; i >= 0; i--) {
                if (base.name[i] == ':') {
                    has_colon = true;
                    base.name = base.name.substr(0, i - 0);
                    break;
                }
            }
            if (!has_colon) {
                base.name = "";
            }
            base.children = [];
            for (var i = 0; i < nodes_cnt; i++) {
                for (var j = 0; j < tot; j++) {
                    if (nodes[i].id == now[j].id) {
                        nodes[i].name = now[j].name;
                        nodes[i].show = 1;
                        nodes[i].z_index = 1;
                        base.children.push(nodes[i]);
                    }
                }
            }
        }

        svg.selectAll('*')
            .remove();

        nodes.sort(function (a, b) {
            return a.z_index - b.z_index;
        });

        text_data = [];
        for (var i = 0; i < nodes.length; i++) {
            var ty = nodes[i].y;
            if (nodes[i].depth <= 1) {
                ty = nodes[i].y + nodes[i].r + 20;
            }
            var fo = "0.9";
            if (nodes[i].depth < 2) {
                fo = "0.5";
            }
            text_data.push({
                x: nodes[i].x - 20,
                y: ty,
                font_size: "10px",
                fill_opacity: fo,
                value: nodes[i].name,
                type: "name",
            });
        }

        svg.selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("fill", "rgb(31, 119, 180)")
            .attr("id", function (d) {
                return "circle" + d.id;
            })
            .attr("name", function (d) {
                return d.name;
            })
            .attr("z-index", function (d) {
                return d.z_index;
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
            .on("mousedown", function (d) {
                if (d3.event.button == 0) {
                    if (d.show == 1 && d.depth > 0) {
                        svg.selectAll("circle")
                            .attr("fill", "rgb(31, 119, 180)")
                            .style("stroke", "")
                        d3.select(this)
                            .attr("fill", "yellow")
                            .style("stroke", "red")
                            .style("stroke-width", "2px")
                            .style("stroke-opacity", 0.3)
                        get_segs(d);
                    } else if (d.depth == 0) {
                        get_segs(null);
                    }
                } else if (d3.event.button == 2) {
                    if (d.depth > 0 && d.node.children != null) {
                        if (d.depth > 1) {
                            draw(d, d.base.r, d.base.x, d.base.y);
                        }
                        if (d.depth == 1) {

                        }
                    }
                }
            });

        svg.selectAll("text")
            .data(text_data)
            .enter()
            .append("text")
            .attr("font-size", function (d) {
                return d.font_size;
            })
            .attr("fill", "black")
            .attr("fill-opacity", function (d) {
                return d.fill_opacity;
            })
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("dx", -12)
            .attr("dy", 1)
            .text(function (d) {
                return d.value;
            });

    }


    // format qs:
    // x,y1,y2,y3,y4,y5
    function query(qs) {
        var url = "http://127.0.0.1:10000/get.php?qs=" + qs;
        xmlhttp = null;
        if (window.XMLHttpRequest) {// code for Firefox, Opera, IE7, etc.
            xmlhttp = new XMLHttpRequest();
        }
        else if (window.ActiveXObject) {// code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        if (xmlhttp != null) {
            xmlhttp.onreadystatechange = state_Change;
            xmlhttp.open("GET", url, true);
            xmlhttp.send(null);
        }
        else {
            alert("Your browser does not support XMLHTTP.");
        }
    }

    function state_Change() {
        if (xmlhttp.readyState == 4) {// 4 = "loaded"
            if (xmlhttp.status == 200) {// 200 = "OK"
                console.log(xmlhttp.responseText);
                draw_seg(xmlhttp.responseText);
            }
            else {
                console.log("Problem retrieving data:" + xmlhttp.statusText);
            }
        }
    }

    function get_segs(c) {
        if (c != null) {
            qs = "";
            shown_nodes = [];
            center = c;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].show == 1 && nodes[i].depth > 1 && nodes[i].base != center.base && nodes[i].id != center.id) {
                    shown_nodes.push(nodes[i]);
                    qs += nodes[i].name;
                    if (i != nodes.length - 1) {
                        qs += ",";
                    }
                }
            }
            query(qs);
        } else {
            draw_seg("");
        }
    }


    function draw_seg(res) {

        svg.selectAll('line')
            .remove();

        segs = [];
        var seg_res = res.split(",");
        for (var i = 0; i < shown_nodes.length; i++) {
            if (seg_res[i] > 0) {
                segs.push({
                    x1: center.x,
                    y1: center.y,
                    x2: shown_nodes[i].x,
                    y2: shown_nodes[i].y,
                    value: seg_res[i],
                });
            }
        }

        svg.selectAll("line")
            .data(segs)
            .enter()
            .append("line")
            .attr("stroke", "black")
            .attr("x1", function (d) {
                return d.x1;
            })
            .attr("y1", function (d) {
                return d.y1;
            })
            .attr("x2", function (d) {
                return d.x2;
            })
            .attr("y2", function (d) {
                return d.y2;
            })
            .text("test");


        svg.selectAll('text')
            .remove();

        text_data = [];
        for (var i = 0; i < nodes.length; i++) {
            var ty = nodes[i].y;
            if (nodes[i].depth <= 1) {
                ty = nodes[i].y + nodes[i].r + 20;
            }
            var fo = "0.9";
            if (nodes[i].depth < 2) {
                fo = "0.5";
            }
            text_data.push({
                x: nodes[i].x - 20,
                y: ty,
                font_size: "10px",
                fill_opacity: fo,
                value: nodes[i].name,
            });
        }

        for (var i = 0; i < segs.length; i++) {
            text_data.push({
                x: (segs[i].x1 + segs[i].x2) / 2.0,
                y: (segs[i].y1 + segs[i].y2) / 2.0,
                font_size: "20px",
                fill_opacity: "0.9",
                value: segs[i].value,
                type: "value",
            });
        }

        svg.selectAll("text")
            .data(text_data)
            .enter()
            .append("text")
            .attr("font-size", function (d) {
                return d.font_size;
            })
            .attr("fill", function (d) { 
                if (d.type == "value") {
                    return "red";
                } else {
                    return "black";
                }
            })
            .attr("x", function (d) {
                return d.x
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("dx", -12)
            .attr("dy", 1)
            .on("click", function (d) {
                if (d.type == "value") {
                    $('#myModal').modal('show');
                }
            })
            .text(function (d) {
                return d.value;
            });
    }
});

