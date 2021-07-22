const loader = document.querySelector("#loading");
const loadingEnded = false;



/* ------------------------------ Fetching data ------------------------------ */
const getDataFromBackend = async () => {
    // Call my express api
    const rest = await fetch("https://my-notion-wiki.herokuapp.com/child_pages");
    return rest;
};

async function getJson() {
    const res = await getDataFromBackend();
    const jsonTree = res.jsonTree;
    return jsonTree;
}

function displayLoading() {
    loader.classList.add("display");
}

function hideLoading() {
    loader.classList.remove("display");
    loader.remove();
}

function isOnExpandedNodeLevel(n, source, root) {
    return ((n.depth === source.depth) 
                && (source._children === null)
                    && (source.children.length > 0)
                        && (source !== root));
}

/* ---------- TODO: Implement better spacing ------------------------------ */
createD3Vis = async () => {
    var margin = { top: 20, right: 120, bottom: 20, left: 250 },
        width = 760 - margin.right - margin.left,
        height = 500 - margin.top - margin.bottom;

    var i = 0,
        duration = 750,
        root;

    var tree = d3.layout.tree()
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function (d) { return [d.y, d.x]; });

    /* Add svg div to HTML */
    var svg = d3.select("#container").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /* ------------------------------ get Data ------------------------------ */
    const jsonHierarchy = await getDataFromBackend();

    console.log(`Vis.js JSON Loaded: ${JSON.stringify(jsonHierarchy)}`);

    d3.json("../tempData/data.json", function (error, flare) {
        root = flare;
        root.x0 = height / 2;
        root.y0 = 0;

         // Collapse the node and all it's children
        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

         // Collapse after the second level
        root.children.forEach(collapse);
        update(root);
    });

    d3.select(self.frameElement).style("height", "800px");

    function update(source) {
        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) { d.y = d.depth * 150; });
       

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) { 
                return "translate(" + source.y0 + "," + source.x0 + ")"; 
            })
            .on("click", click);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function (d) { 
                return d.children || d._children ? "#fff" : "lightsteelblue"; 
            });

        nodeEnter.append("text")
            .attr("x", function (d) { 
                return d.children || d._children ? -20 : 20; 
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) { 
                return d.children || d._children ? "end" : "start"; 
            })
            .text(function (d) { return d.name; })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) { 
                if(isOnExpandedNodeLevel(d, source, root)){
                    // if(d !== source){
                    //     d.x = d.x * 1.3;
                    // }
                }
                return "translate(" + d.y + "," + d.x + ")"; 
            })
            .style("padding", 10)

        nodeUpdate.select("circle")
            .attr("r", 10)
            .style("fill", function (d) { return d.children || d._children ? "#fff" : "lightsteelblue"; });

        // Fade text on nodes level if it is expanded (except for)
        nodeUpdate.select("text")
        .style("fill-opacity", function (d) { 
            const res = isOnExpandedNodeLevel(d, source, root);
            return (res) ?  0.3 : 1;
        });

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        
        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function (d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = { x: source.x0, y: source.y0 };
                return diagonal({ source: o, target: o });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                var o = { x: source.x, y: source.y };
                return diagonal({ source: o, target: o });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        console.log(`d.x: ${d.x} d.y: ${d.y} d.depth ${d.depth} `)
        update(d);
    }

    hideLoading();
}

// function login(){
//     const loginDiv = document.getElementById("login");

//     var a = document.createElement('a');
//     var linkText = document.createTextNode("Login to Notion with OAuth");
//     a.appendChild(linkText);
//     a.title = "Login Link";
//     // a.href = `https://api.notion.com/v1/oauth/authorize?client_id= ${process.env.OAUTH_CLIENT_ID}&redirect_uri=${}&response_type=code`;
//     loginDiv.appendChild(a);
// }

displayLoading();
createD3Vis();