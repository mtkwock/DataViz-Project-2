window.addEventListener("load", run);

var data;

function run() {
    var updateType1 = function () {
        type1(document.getElementById("changeCategoryType1").value,
            document.getElementById("changeSiteType1").value);
    };
    document.getElementById("changeCategoryType1").onchange = updateType1;
    document.getElementById("changeSiteType1").onchange = updateType1;
    document.getElementById("changeCategoryType2").onchange = function (event) {
        type2(event.srcElement.value);
    };
    type1("race", "facebook");
    type2("gender");

}

var type1 = function (demographic, website) {
    demographic = demographic || "race";
    website = website || "facebook";

    var data = getDataRows(demographic, website);

    var svg = d3.select("#viz");
    d3.selectAll("#viz > *").remove();

    // get the size of the SVG element
    var height = svg.attr("height");
    var width = svg.attr("width");

    // the chart lives in the svg surrounded by a margin of 75px
    var margin = 66;
    var chartHeight = height - 2 * margin;
    var chartWidth = width - 2 * margin;

    // figure out the width of the bars so that all bars fit and there's a bar width
    // between them note that every data point now has _2_ bars associated with it
    var barWidth = chartWidth / (1.25 * data.length - .25);

    var color = ["lightgrey", "cyan", "magenta", "yellow"];

    data.forEach(function (v, i) {
        // compute the height of the bar as a proportion of the available chartHeight
        var barHeight = chartHeight * v.value / 100;
        // figure out where the vetical bar starts
        var yPos = height - margin - barHeight;

        // create bar & value text add some styles to make it pretty too

        svg.append("rect")
            .attr("x", margin + (i * 1.25) * barWidth)
            .attr("y", yPos)
            .attr("width", barWidth)
            .attr("height", barHeight)
            //.style("stroke","black")
            .style("stroke-width", "2px")
            .style("fill", color[i]);

        svg.append("text")
            .attr("x", margin + (i * 1.25) * barWidth + barWidth / 2)
            .attr("y", yPos - 20)
            .attr("dy", "0.3em")
            .attr("class", "bartext")
            .style("fill", color[i])
            .text(v.value + "%");
    });

    // show the labels (position them centered)
    data.forEach(function (v, i) {
        svg.append("text")
            .attr("x", margin + (i * 1.25) * barWidth + barWidth / 2)
            .attr("y", margin + chartHeight + 25)
            .attr("dy", "0.3em")
            .style("text-anchor", "middle")
            .style("font-family", "monospace")
            .style("font-size", "16px")
            .style("fill", color[i])
            .text(v.group)
            //.valign("top")
            //.width(barWidth);

        //.container(d3.select("#rectWrap"))
    });
};

// Plots by category.  Bubble comparisons between four or five groups
// All five sites around are compared (by area) within each group
// All statistics are normalized to a width of Val% / MaxVal% * WIDTH
var type2 = function (category) {
    var svg = d3.select("#viz2");
    d3.selectAll("#viz2 > *").remove();
    var maxDiameter = 80;
    var internalRadius = maxDiameter * 0.84;
    var externalRadius = maxDiameter * 2.5;
    var externalVerticalScale = 0.60;
    var pi2 = 2 * Math.PI;
    var padding = 2;
    var center = {
        x: svg.attr("width") / 2,
        y: svg.attr("height") / 2
    }
    var siteStatic = {
        facebook: {
            link: "http://www.blueye.com/img/footer/facebook-logo.svg",
            angle: 0,
            radius: internalRadius
        },
        pinterest: {
            link: "https://worldvectorlogo.com/logos/pinterest-circle.svg",
            angle: pi2 / 5,
            radius: internalRadius,
        },
        instagram: {
            link: "http://burnedpixel.com/images/instagram_circle.svg",
            angle: pi2 / 5 * 2,
            radius: internalRadius,
        },
        linkedin: {
            link: "http://www.attendly.com/wp-content/themes/attendly2/img/icon-linkedin.svg",
            angle: pi2 / 5 * 3,
            radius: internalRadius,
        },
        twitter: {
            link: "http://re.silience.com/img/icon-twitter.svg",
            angle: pi2 / 5 * 4,
            radius: internalRadius,
        },
    };

    var sites = ["facebook", "pinterest", "instagram", "linkedin", "twitter"];
    var data = getDataRows(category);
    var groups = Object.getOwnPropertyNames(
        data.reduce(function (acc, next) {
            acc[next.group] = true;
            return acc;
        }, {})
    );
    var groupPos = {};
    var del = (groups.length % 2) * Math.PI / 2;
    for (var i = 0; i < groups.length; i++) {
        var angle = pi2 * i / groups.length + del;
        groupPos[groups[i]] = {};
        groupPos[groups[i]].x = externalRadius * Math.cos(angle);
        groupPos[groups[i]].y = externalRadius * Math.sin(angle) * externalVerticalScale;
    }

    // Account for single group.  Centers it instead of putting around circle
    if (groups.length === 1) {
        groupPos[groups[0]].x = 0;
        groupPos[groups[0]].y = 0;
    }

    var basicText = groups.map(function (groupName) {
        return {
            text: groupName,
            x: groupPos[groupName].x,
            y: groupPos[groupName].y + maxDiameter * 1.3
        }
    });

    basicText.unshift({
        text: "Percentage of Users by " + category + " using Social Networking",
        size: 25,
        x: 0,
        y: -210
    });

    var highest = data.reduce(function (a, b) { // Used to normalize bubble size
        return b.value > a ? b.value : a
    }, 0);

    var normalData = data.map(function (row) {
        return {
            site: row.site,
            siteStatic: siteStatic[row.site],
            group: row.group,
            groupStatic: groupPos[row.group],
            value: row.value,
            height: maxDiameter * Math.pow(row.value / highest, 0.5), // Calculates element height
            width: maxDiameter * Math.pow(row.value / highest, 0.5), // Calculates element width
            delta: {
                angle: 0, // Angle change.  Can be negative or positive and change in increments of Math.PI/50
                radius: 0 // Radius change.  SHOULD be negative and change in increments of 1
            },
            angle: function () {
                return this.siteStatic.angle + this.delta.angle;
            },
            radius: function () {
                return this.siteStatic.radius + this.delta.radius;
            },
            centerX: function () {
                return this.radius() * Math.cos(this.angle()) + this.groupStatic.x;
            },
            getX: function () {
                return this.centerX() - (this.width / 2); // Center
            },
            centerY: function () { // Get center of  icon.  Not adjusted for radius
                return this.radius() * Math.sin(this.angle()) + this.groupStatic.y;
            },
            getY: function () { // Adjust for radius
                return this.centerY() - (this.height / 2); // Center
            }
        };
    });

    var spaceExists = function (normData0, normData1) {
        var distance = Math.pow(
            Math.pow(normData0.centerX() - normData1.centerX(), 2) + // dx^2
            Math.pow(normData0.centerY() - normData1.centerY(), 2), // dy^2
            0.5);
        // var positions = [normData0.getX(), normData0.getY(), normData0]
        var goalDistance = (normData0.width + normData1.width) / 2 + padding;
        return distance > goalDistance;
    };

    // Takes a group of data in a circular formation and moves them closer
    // together by a small refining factor.
    // returns true if and only if anything changed
    var refine = function (dataGroup) {
        var changed = false; // Determines if another round needs to occur
        var length = dataGroup.length;
        for (var i = 0; i < length; i++) {
            var d0 = dataGroup[(i + length - 1) % length]; // Icon before
            var d1 = dataGroup[i]; // Current Icon
            var d2 = dataGroup[(i + 1) % length]; // Next Icon
            if (d1.delta.radius > -100) { // Sanity check to make sure that radius isn't too small
                var spaceBefore = spaceExists(d0, d1); // Determine if space to move closer to d0
                var spaceAfter = spaceExists(d1, d2); // Determins if space to move closer to d2
                if (spaceBefore && spaceAfter) { // Move towards the center by 0.5 pixels
                    d1.delta.radius -= 0.5;
                } else if (spaceBefore) { // Move closer to d0 and rotate a bit
                    d1.delta.radius -= 0.5;
                    d1.delta.angle -= Math.PI / 100;
                } else if (spaceAfter) { // Move closer to d2 and rotate a bit
                    d1.delta.radius -= 0.5;
                    d1.delta.angle += Math.PI / 100;
                }
                changed = changed || spaceAfter || spaceBefore;
            }
        }
        return changed;
    };

    groups.forEach(function (group) {
        var groupData = normalData.filter(function (row) {
            return row.group === group;
        });
        var unrefined = true;
        while (unrefined) {
            unrefined = refine(groupData);
        }
    });

    var tip = d3.tip()
        .attr("class", "d3-tip")
        .offset(function (d) {
            return Math.sin(d.angle()) <= 0 ? [-5, 0] : [d.height + 45, 0];
        })
        .html(function (d) {
            return d.value + "%"
        });

    svg.call(tip);

    svg.selectAll("image").data(normalData).enter()
        .append("svg:image")
        .attr("x", function (dat) {
            return center.x + dat.getX();
        })
        .attr("y", function (dat) {
            return center.y + dat.getY();
        })
        .attr("width", function (dat) {
            return dat.width;
        })
        .attr("height", function (dat) {
            return dat.height;
        })
        .attr("xlink:href", function (dat) {
            return dat.siteStatic.link;
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

    // Write labels on screen
    svg.selectAll("text").data(basicText)
        .enter()
        .append("svg:text")
        .attr("font-size", function (dat) {
            return dat.size || 16;
        })
        .attr("x", function (dat) {
            return dat.x + center.x;
        })
        .attr("y", function (dat) {
            return dat.y + center.y;
        })
        .attr("class", "bartext")
        .attr("fill", "cyan")
        .text(function (dat) {
            return dat.text;
        });
};

/* From
http://www.pewinternet.org/files/2015/01/PI_SocialMediaUpdate20144.pdf
*/

// Note: the data variable is obtained from data.json
getDataRows = function (category, site) {
    return data.filter(function (row) {
        return (!category || row.category === category) && (!site || row.site === site);
    });
};