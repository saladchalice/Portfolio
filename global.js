console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a")
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// if (currentLink) {
//   // or if (currentLink !== undefined)
//   currentLink.classList.add('current');
// }



let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/saladchalice/shrkshkk', title: 'Github' }
];

//are we on the home page?
// const is like let but it's immutable
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// Determine the base URL for GitHub Pages
const BASE_URL = window.location.pathname.includes('/Portfolio/') ? '/Portfolio/' : '/';

// create nav element and place at beginning of body
let nav = document.createElement('nav')
document.body.prepend(nav);
// edit url
//iterate over pages and add <a> elements for all links

for (let p of pages){
  let url = p.url;
  let title = p.title;
  url = !ARE_WE_HOME && !url.startsWith('http') ? BASE_URL + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);  
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );
  if (a.host !== location.host) {
    a.target = "_blank"
  }
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value = 'automatic'>Automatic</option>
			<option value = 'light'>Light</option>
			<option value = 'dark'>Dark</option>
		</select>
	</label>`
);

let select = document.querySelector('select');

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
  localStorage.colorScheme = event.target.value
});

const saved = localStorage.getItem('colorScheme');
    if (saved) {
      select.value = saved;
      document.documentElement.style.setProperty('color-scheme', saved);
    }


// fetch json from url and return data
export async function fetchJSON(url) {
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      // console.log(response);
      const data = await response.json();
      return data; 


  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  }
}

console.log(fetchJSON('../lib/projects.json'));

// render projects function
// we need project and containerElemenet as parameters because we 
// must locate a specific project, then a container element to put them in

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Check if containerElement is null or undefined
  if (!containerElement) {
    console.error('Container element is null or undefined.');
    return;
  }

  // Validate headingLevel
  const validHeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!validHeadingLevels.includes(headingLevel)) {
    console.error('Invalid heading level:', headingLevel);
    headingLevel = 'h2'; // Fallback to default heading level
  }

  // Clear the containerElement to make sure no duplicates
  containerElement.innerHTML = '';

  // Check if projects array is empty
  if (projects.length === 0) {
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No projects available.';
    containerElement.appendChild(placeholder);
    return;
  }

  // Iterate over each project in the projects array
  projects.forEach(project => {
    const article = document.createElement('article');
    
    // Use default values if properties are missing
    const title = project.title || 'Untitled Project';
    const image = project.image || 'default-image.png';
    const description = project.description || 'No description available.';
    const style = project.style || '';
    const year = project.year || 'Year unknown';
    
    // Create heading element dynamically based on headingLevel
    const heading = document.createElement(headingLevel);
    heading.textContent = title;
    
    article.innerHTML = `
      <img src="${image}" alt="${title}" style="width: 100%; max-width: 100%; height: auto;">
      <h4>${year}</h4>
      <p>${description}</p>`;
    
    article.prepend(heading);
    containerElement.appendChild(article);
  });
}


// fetch github data
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);

}