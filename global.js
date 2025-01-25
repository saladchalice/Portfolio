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



// create nav element and place at beginning of body
let nav = document.createElement('nav')
document.body.prepend(nav);
// edit url
//iterate over pages and add <a> elements for all links

for (let p of pages){
  let url = p.url;
  let title = p.title;
  url = !ARE_WE_HOME && !url.startsWith('http') ? '/Portfolio/' + url : url;

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

