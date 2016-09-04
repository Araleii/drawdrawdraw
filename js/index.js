// 服务端需要实现对两种请求的处理:
// 1.
// 请求数据为这样格式的字符串:  "node0,node1,node2,...,noden"
// 意思是查询node0 与 [node1, node2, ... , noden] 这些节点的关系, 其中每个node都是一个名字
// 对于该请求,需要返回的数据格式为:    "value1, value2, value3, ... , valuen" 这样的一个以逗号分隔的字符串
// value1代表node0与node1的关系权值,以此类推.
//
// 2.
// 请求数据格式为: "name1, name2"  这样的字符串
// 返回数据为一个json字符串: 有3个list, 第一个list为左边一列的元素,对应于name1, 第二个list为右边一列的元素,对应于name2; 
// 这两个list都有name和id两个值;最后一个list是一个(a_id, b_id)的这样格式得list
// 表示所有的边. 需要注意的是,返回的两个name list的id都要从0到长度-1.
// 以上3个list命名分别为namelist1, namelist2, relationlist.
// 结构举例如下:
// {"namelist1": [{"name":"Bill", "id":0},{"name":"Alice", "id":1},{"name":"Bob", "id":2},{"name":"Jim", "id":3},{"name":"Tom", "id":4},{"name":"Jerry", "id":5},{"name":"Kate", "id":6}],"namelist2": [{"name":"apple", "id":0},{"name":"pear", "id":1},{"name":"orange", "id":2},{"name":"peach", "id":3},{"name":"grape", "id":4},{"name":"watermelon", "id":5},{"name":"banana", "id":6},{"name":"tomato", "id":7}],  "relationlist":[{"l":0, "r": 0},{"l":0, "r": 1},{"l":0, "r": 2},{"l":1, "r": 0},{"l":1, "r": 2},{"l":2, "r": 1},{"l":2, "r": 5},{"l":2, "r": 7},{"l":3, "r": 4},{"l":4, "r": 7},{"l":5, "r": 5},{"l":6, "r": 5},{"l":6, "r": 7}]}
//
// 请求中的参数qtype为0代表第一种请求,1代表第二种请求.


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
        var url = "http://127.0.0.1:10000/get.php?qtype=0&qs=" + qs;
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
                    name1: center.name,
                    name2: shown_nodes[i].name,
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
                seg: segs[i],
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
                    var aj = $.ajax({
                        url: "http://127.0.0.1:10000/get.php?qtype=1&qs=" + d.seg.name1 + "," + d.seg.name2,  
                        type: 'get',
                        success: function (data) {
                            draw_table(data);    
                        },
                        error: function () {
                            console.log("error");
                        }
                    });
                    $('#myModal').modal('show');
                }
            })
            .text(function (d) {
                return d.value;
            });

        // 该函数主要画关系对应表
        function draw_table(data) {

            console.log(data);
            var res = JSON.parse(data);
            
            var max_length = Math.max(res.namelist1.length, res.namelist2.length);
            
            var root_left = 40;
            var root_right = 0;
            var root_width = 350;
            var root_height = max_length * 20 * 2;

            var table_text_data = [];
            
            var table_nodes = [];
            var l1 = res.namelist1.length;
            var dh1 = (1.0 * root_height / l1);
            for (var i = 0; i < l1; i++) {  
                table_nodes.push({
                    x: root_left,
                    y: root_right + dh1 * i * 1.5,
                    w: 50,
                    h: dh1,
                });
                table_text_data.push({  
                    x: root_left + 20,
                    y: root_right + dh1 * i * 1.5 + dh1 * 0.5,
                    value: res.namelist1[i].name,
                });
            }
            
            var l2 = res.namelist2.length;
            var dh2 = (1.0 * root_height / l2);
            for (var i = 0; i < l2; i++) {
                table_nodes.push({
                    x: root_left + root_width,
                    y: root_right + dh2 * i * 1.5,
                    w: 50,
                    h: dh2, 
                });
                table_text_data.push({
                    x: root_left + root_width + 20,
                    y: root_right + dh2 * i * 1.5 + dh2 * 0.5,
                    value: res.namelist2[i].name,
                });
            }
            
            var table_segs = [];
            for (var i = 0; i < res.relationlist.length; i++) {    
                table_segs.push({
                    x1: root_left + 50,
                    y1: table_nodes[res.relationlist[i].l].y + 0.5 * dh1,
                    x2: root_left + root_width,
                    y2: table_nodes[res.relationlist[i].r + l1].y + 0.5 * dh2,
                });
            }
            
            
            d3.select("#model_svg").selectAll("svg").remove();
            var model_svg = d3.select("#model_svg").append("svg")
                .attr("width", 500)
                .attr("height", root_height * 1.5)
                .append("g")
                .attr("transform", "translate(0,0)");

            model_svg.selectAll("rect")
                .data(table_nodes)
                .enter()
                .append("rect")
                .attr("fill", "rgb(31, 119, 180)")
                .attr("fill-opacity", function (d) {
                    return "0.4";
                })
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                })
                .attr("width", function (d) {
                    return d.w;
                })
                .attr("height", function (d) {
                    return d.h;
                });
            
            model_svg.selectAll("line")
                .data(table_segs)
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
                });

            model_svg.selectAll("text")
                .data(table_text_data)
                .enter()
                .append("text")
                .attr("font-size", function (d) {
                    return "10px";
                })
                .attr("fill", function (d) {
                    return "black";
                })
                .attr("x", function (d) {
                    return d.x
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
    }
});

