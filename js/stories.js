'use strict';

// This is the global list of the stories, an instance of StoryList
let storyList;

'use strict';


// async function main() {
// 	if (token) {
// 		// Token is present
// 	} else {
// 		// Token is not present
// 	}

// 	axios.post(url, data, {
// 		headers: {
// 		  Authorization: `Bearer ${token}`
// 		}
// 	  })
// 	  .then(response => console.log(response.data))
// 	  .catch(error => console.log(error));
	  

// 	await getAndShowStoriesOnStart();
// }

// main();

  

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart () {
	storyList = await StoryList.getStories();
	$storiesLoadingMsg.remove();

	putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup (story, showDeleteBtn = false) {
	// console.debug("generateStoryMarkup", story);

	const hostName = story.getHostName();
	const showFavorite = Boolean(currentUser)
	return $(`
      <li id="${story.storyId}">
	  	${showDeleteBtn ? getDeleteBtnHTML() : ''}
		${showFavorite ? getFavoriteHTML(story, currentUser) : ''}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function getDeleteBtnHTML() {
	return 	`
	<span class='trash-can'>
	<i class='fas fa-trash-alt'></i>
	</span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage () {
	console.debug('putStoriesOnPage');

	$allStoriesList.empty();

	// loop through all of our stories and generate HTML for them
	for (let story of storyList.stories) {
		const $story = generateStoryMarkup(story);
		$allStoriesList.append($story);
	}

	$allStoriesList.show();
}

async function submitNewStory(e) {
	console.debug("submitNewStory");
	e.preventDefault();
  
	// grab all info from form
	const title = $("#create-title").val();
	const url = $("#create-url").val();
	const author = $("#create-author").val();
	const username = currentUser.username
	const storyData = {title, url, author, username };
  
	const story = await storyList.addStory(currentUser, storyData);
  
	const $story = generateStoryMarkup(story);
	$allStoriesList.prepend($story);
  
	// hide the form and reset it
	$submitForm.slideUp("slow");
	$submitForm.trigger("reset");
  }
  
  $submitForm.on("submit", submitNewStory);


function getFavoriteHTML(story, user) {
	const isFavorite = user.isFavorite(story);
	const starType = isFavorite ? 'fas' : 'far';
	return `
		<span class='star'>
			<i class='${starType} fa-star'></i>
		</span>`;
}

async function deleteStory(e) {
	console.debug('deleteStory');

	const $closestLi = $(e.target).closest('li');
	const storyId = $closestLi.attr('id');

	await storyList.removeStory(currentUser, storyId);

	await putStoriesOnPage();
}

$ownStories.on('click', '.trash-can', deleteStory);

function postFavoritesListPage() {
	console.debug('postFavoritesListOnPage');
	$favoredStories.empty()

	if (currentUser.favorites.length === 0) {
		$favoredStories.append("<h5>No Favorites Listed</h5>");
	} else {
		for (let story of currentUser.favorites) {
			const $story = generateStoryMarkup(story);
			$favoredStories.append($story);
		}
	}
	$favoritedStories.show();
}

async function toggleFavoriteStories(e) {
	console.debug('toggleFavoriteStories');

	const $tgt = $(e.target);
	const $closestLi = $tgt.closest('li');
	const storyId = $closestLi.attr('id');
	const story = storyList.stories.find(s => s.storyId === storyId);

	if ($tgt.hasClass('fas')) {
		await currentUser.removeFavorite(story);
		$tgt.closest('i').toggleClass('fas far');
	}
}
$storiesLists.on('click', '.star', toggleFavoriteStories)

