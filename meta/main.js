let data = [];
let commits = [];
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
    createScatterplot();

    //slider functionality ---------------------------------------------------------
    // select elements

    let commitProgress = 100;
    let timeScale = d3.scaleTime([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)], [0, 100]);
    let commitMaxTime = timeScale.invert(commitProgress);

    const progressSlider = document.getElementById('progress-slider');
    const selectedProgress = document.getElementById('selected-progress');
    const anyTimeLabel = document.getElementById('any-progress');

    function updateProgressDisplay() {
        commitProgress = Number(progressSlider.value);  // Get slider value
        commitMaxTime = timeScale.invert(commitProgress);

        if (commitProgress === -1) {
          selectedProgress.textContent = '';  // Clear time display
          anyTimeLabel.textContent = timeScale[0];  // Clear time display
          anyTimeLabel.style.display = 'block';  // Show "(any time)"
        } else {
          selectedProgress.textContent = new Date(commitMaxTime).toLocaleString(undefined, { 
            dateStyle: "long", 
            timeStyle: "short" 
            });
          anyTimeLabel.style.display = 'none';  // Hide "(any time)"
        }

    // Trigger filtering logic which will be implemented in the next step
    let filteredCommits = commits.filter(commit => commit.datetime < commitMaxTime);
    let filteredLines = data.filter(item => item.datetime < commitMaxTime);
    }

    progressSlider.addEventListener('input', updateProgressDisplay);

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
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Add more stats as needed...
    // Add maximum file length (in lines)
    dl.append('dt').text('Maximum file length (in lines)');
    dl.append('dd').text(d3.max(data, d => d.length));

    // Add average depth
    dl.append('dt').text('Average depth');
    dl.append('dd').text(d3.mean(data, d => d.depth).toFixed(2))
    
    dl.append('dt').text('Total files');
    dl.append('dd').text(d3.group(data, d => d.file).size);

    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file
      );
    const averageFileLength = d3.mean(fileLengths, (d) => d[1]);

    dl.append('dt').text('Average file length');
    dl.append('dd').text(averageFileLength.toFixed(2));

  }



// plotting --------------------------------------------------------
function createScatterplot(){
  // Sort commits by total lines in descending order
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    const width = 1000;
    const height = 600;

    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const dots = svg.append('g').attr('class', 'dots');

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([8, 25]); // adjust these values based on your experimentation


    // plot data as dots
    dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore transparency
      updateTooltipContent({}); // Clear tooltip content
      updateTooltipVisibility(false);
    });

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



