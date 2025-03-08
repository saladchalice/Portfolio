let data = [];
let commits = [];
let filteredCommits=[];
let xScale, yScale;


async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
      ...row, 
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    commits = d3.groups(data, (d) => d.commit);
    // processCommits();
    // console.log(commits);
    displayStats();
    // createScatterplot();

    //slider functionality ---------------------------------------------------------
    // select elements

    // let commitProgress = 100;
    // let timeScale = d3.scaleTime([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)], [0, 100]);
    // let commitMaxTime = timeScale.invert(commitProgress);

    // const progressSlider = document.getElementById('progress-slider');
    // const selectedProgress = document.getElementById('selected-progress');
    // const anyTimeLabel = document.getElementById('any-progress');


    // function updateProgressDisplay() {
    //     commitProgress = Number(progressSlider.value);  // Get slider value
    //     commitMaxTime = timeScale.invert(commitProgress);

    //     if (commitProgress === -1) {
    //       selectedProgress.textContent = '';  // Clear time display
    //       anyTimeLabel.textContent = timeScale[0];  // Clear time display
    //       anyTimeLabel.style.display = 'block';  // Show "(any time)"
    //     } else {
    //       selectedProgress.textContent = new Date(commitMaxTime).toLocaleString(undefined, { 
    //         dateStyle: "long", 
    //         timeStyle: "short" 
    //         });
    //       anyTimeLabel.style.display = 'none';  // Hide "(any time)"
    //     }

    //     // Trigger filtering logic which will be implemented in the next step
    //     filteredCommits = commits.filter(d => new Date(d.datetime) < commitMaxTime);
    //     // console.log(filteredCommits);

    //     // --------------- other
    //     let lines = filteredCommits.flatMap((d) => d.lines);
    //     let files = [];
    //     files = d3
    //       .groups(lines, (d) => d.file)
    //       .map(([name, lines]) => {
    //         return { name, lines };
    //       });
    //     files = d3.sort(files, (d) => -d.lines.length);
    //     // console.log(lines);


    //     d3.select('.files').selectAll('div').remove(); // don't forget to clear everything first so we can re-render
    //     let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');
        

    //     filesContainer.append('dt')
    //     .attr('id','files') // Add unique ID to <dt> based on index
    //     .append('code')
    //     .text(d => d.name)
    //     .append('small')
    //     .html(d => `${d.lines.length} lines`)
    //     .style('display', 'block')
    //     .style('font-size', 'smaller')
    //     .style('opacity', 0.6);
      
    //     let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

    //     filesContainer.append('dd')
    //       .attr('id', 'files') // Add unique ID to <dd> based on index
    //       .selectAll('div')
    //       .data(d => d.lines)  // Use 'lines' as the data source for each <div>
    //       .enter()
    //       .append('div')  // Append a <div> for each line
    //       .attr('class', 'line')  // Set the class for styling
    //       .style('background',d => fileTypeColors(d.type));



    //     // sort files by number of lines

                
  
    //     // updateCircles(filterTripsByTime());
    //     updateScatterplot(filteredCommits);
    // }
    updateScatterplot(filteredCommits);

    // progressSlider.addEventListener('input', updateProgressDisplay);

    // scrolly stuff
    let ITEM_HEIGHT = 120; // Feel free to change
    let VISIBLE_COUNT = 3; // Feel free to change as well
    let totalHeight = (commits.length - 1) * ITEM_HEIGHT;
    
    const scrollContainer = d3.select('#scroll-container');
    const spacer = d3.select('#spacer');
    spacer.style('height', `${totalHeight}px`);
    const itemsContainer = d3.select('#items-container');
    
    let currentStartIndex = 0; // Track the current start index to prevent unnecessary rerenders
    
    scrollContainer.on('scroll', () => {
        const scrollTop = scrollContainer.property('scrollTop');
        let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
        startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
    
        // If the start index has changed, render items from the new start index
        if (startIndex !== currentStartIndex) {
            currentStartIndex = startIndex;
            renderItems(currentStartIndex);
        }
    });
    
    function renderItems(startIndex) {
        const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
        let newCommitSlice = commits.slice(startIndex, endIndex);
    
        console.log(newCommitSlice);
    
        // Update scatterplot with the new visible commits
        updateScatterplot(newCommitSlice);
    
        // Select existing commit elements, binding data to them
        let commitSelection = itemsContainer.selectAll('.commit-item')
            .data(newCommitSlice, d => d.datetime); // Use datetime as a unique key
    
        // **ENTER**: Create new elements only when needed
        commitSelection.enter()
            .append('div')
            .classed('commit-item', true)
            .merge(commitSelection) // Merge enter and update selections
            .style('position', 'absolute')
            .style('top', (commit, idx) => `${(startIndex + idx) * ITEM_HEIGHT}px`) // Position each correctly in scroll space
            .html((commit, idx) => `
                <p>
                    On ${commit.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}, I made
                    <a href="${commit.url}" target="_blank">
                        ${startIndex + idx > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
                    </a>.
                    I edited ${commit.totalLines} lines across ${d3.rollups(commit.lines, D => D.length, d => d.file).length} files.
                    Reviewed what was pushed and it all looked pretty good. 
                </p>
                <hr style="border: none; border-top: 1px solid #bbb; margin: 10px 0;">
            `)
            .style('width', '100%')
            .style('padding', '10px')
            .style('background', '#f8f9fa')
            .style('border-bottom', '1px solid #ddd');  // Light grey border
    
        // **EXIT**: Remove elements no longer in view
        commitSelection.exit().remove();
    }

    function displayCommitFiles() {
      const lines = filteredCommits.flatMap((d) => d.lines);
      let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
      let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => {
        return { name, lines };
      });
      files = d3.sort(files, (d) => -d.lines.length);
      d3.select('.files').selectAll('div').remove();
      let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');
      filesContainer.append('dt').html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
      filesContainer.append('dd')
                    .selectAll('div')
                    .data(d => d.lines)
                    .enter()
                    .append('div')
                    .attr('class', 'line')
                    .style('background', d => fileTypeColors(d.type));
    }
    
  
  }

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/saladchalice/Portfolio/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          configurable: false,
          writable: false,
          enumerable: true
        });
  
        return ret;
      });
  }

  function displayStats() {
    // Process commits first
    processCommits();
  
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt')
      .html('TOTAL <abbr title="Lines of code">LOC</abbr>')
      .attr('class', 'stats');
    dl.append('dd')
      .text(data.length)
      .attr('class', 'stats');
  
    // Add total commits
    dl.append('dt')
      .text('TOTAL COMMITS')
      .attr('class', 'stats');
    dl.append('dd')
      .text(commits.length)
      .attr('class', 'stats');
  
    // Add more stats as needed...
    // Add maximum file length (in lines)
    dl.append('dt')
      .text('MAX FILE SIZE')
      .attr('class', 'stats');
    dl.append('dd')
      .text(d3.max(data, d => d.length))
      .attr('class', 'stats');
  
    // Add average depth
    dl.append('dt')
      .text('AVERAGE DEPTH')
      .attr('class', 'stats');
    dl.append('dd')
      .text(d3.mean(data, d => d.depth).toFixed(2))
      .attr('class', 'stats');
  
    dl.append('dt')
      .text('FILES')
      .attr('class', 'stats');
    dl.append('dd')
      .text(d3.group(data, d => d.file).size)
      .attr('class', 'stats');
  
    const fileLengths = d3.rollups(
      data,
      (v) => d3.max(v, (v) => v.line),
      (d) => d.file
    );
    const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
  
    dl.append('dt')
      .text('AVERAGE FILE LENGTH')
      .attr('class', 'stats');
    dl.append('dd')
      .text(averageFileLength.toFixed(2))
      .attr('class', 'stats');
  }
  


// plotting --------------------------------------------------------
function updateScatterplot(filteredCommits) {
  // same as before
  const width = 1000;
  const height = 600;

  d3.select('svg').remove(); // first clear the svg
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');


  xScale = d3
  .scaleTime()
  .domain(d3.extent(filteredCommits, (d) => new Date(d.datetime)))
  .range([0, width])
  .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);


  /// same as before

  // svg.selectAll('g').remove(); // clear the scatters in order to re-draw the filtered ones
  const dots = svg.append('g').attr('class', 'dots');

  // same as before

  const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([8, 25]); // adjust these values based on your experimentation

  // same as before

  dots
    .selectAll('circle')
    .data(filteredCommits, d => d.id) // Assuming each commit has a unique 'id'
    .join(
      // Enter - new circles are added
      enter => enter.append('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .attr('fill', 'steelblue')
        .style("--r", d => rScale(d.totalLines))
        .transition() // Smooth transition for new circles
        .duration(300)
        .attr('cx', d => xScale(d.datetime))
        .attr('r', d => rScale(d.totalLines)),

      // Update - existing circles' positions are updated smoothly
      update => update
        .transition() // Transition for existing circles
        .duration(300)
        .attr('cx', d => xScale(d.datetime)) // Transition the cx to the new x position
        .attr('r', d => rScale(d.totalLines)) // Transition the radius

      // Exit - circles that are removed (optional, if you want to clear out data)
      // exit => exit.transition().duration(300).attr('cx', -50).remove() 
    )
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', function() {
      d3.select(this).style('fill-opacity', 0.7); // Restore transparency
      updateTooltipContent({}); // Clear tooltip content
      updateTooltipVisibility(false);
    });
  
  

  // same as before
  // add axes
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  // usable area
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Add gridlines BEFORE the axes
  const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width))
  .selectAll('line')
  .attr('class', (d) => (d >= 6 && d <= 18 ? 'gridline-day' : 'gridline-night'));

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

// Add X axis
  svg
  .append('g')
  .attr('transform', `translate(0, ${usableArea.bottom})`)
  .call(xAxis);

  // Add Y axis
  svg
  .append('g')
  .attr('transform', `translate(${usableArea.left}, 0)`)
  .call(yAxis);

  brushSelector();
}

function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}


// Brushing --------------------------------------------------------
// setup brush
function brushSelector() {
  const svg = document.querySelector('svg');
  d3.select(svg).call(d3.brush().on('start brush end', brushed));
  // Raise dots and everything after overlay
  d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}


// making selection work
let brushSelection = null;

function brushed(event) {
  brushSelection = event.selection;
  updateSelection();
  updateLanguageBreakdown();

}

function isCommitSelected(commit) {
  if (!brushSelection) return false;
  const min = { x: brushSelection[0][0], y: brushSelection[0][1] };
  const max = { x: brushSelection[1][0], y: brushSelection[1][1] };
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];

  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}


// language percent
function updateLanguageBreakdown() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}:</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}




