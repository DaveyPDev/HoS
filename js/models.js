'use strict';

const BASE_URL = 'https://hack-or-snooze-v3.herokuapp.com';

/******************************************************************************
 * Story: a single story in the system
 */

class Story {
	/** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

	constructor ({ storyId, title, author, url, username, createdAt }) {
		this.storyId = storyId;
		this.title = title;
		this.author = author;
		this.url = url;
		this.username = username;
		this.createdAt = createdAt;
	}

	/** Parses hostname out of URL and returns it. */

	getHostName () {
		// UNIMPLEMENTED: complete this function!
		return new URL (this.url).host;
	}
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
	constructor (stories) {
		this.stories = stories;
	}

	/** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

	static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

	/** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

	async addStory(user, { title, author, url }) {
		const token = user.loginToken;
		const res = await axios({
		  method: "POST",
		  url: `${BASE_URL}/stories`,
		  data: { token, story: { title, author, url } },
		});
	
		const story = new Story(res.data.story);
		this.stories.unshift(story);
		user.ownStories.unshift(story);

		// console.log(token)
		return story;
	  }

	  

	  async removeStory(user, storyId) {
		const token = user.loginToken;
		await axios ({
			method: "DELETE",
			url: `${BASE_URL}/stories/${storyId}`,
			data: { token: user.loginToken },
		});

		this.stories = this.stories.filter(story => story.storyId !== storyId);

		user.ownStories = user.ownStories.filter(s => s.storyId !== storyId);
		user.favorites = user.favorites.filter( s => s.storyId !== storyId);
	  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
	/** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

	constructor ({ username, name, createdAt, favorites = [], ownStories = [] }, token) {
		this.username = username;
		this.name = name;
		this.createdAt = createdAt;

		// instantiate Story instances for the user's favorites and ownStories
		this.favorites = favorites.map((s) => new Story(s));
		this.ownStories = ownStories.map((s) => new Story(s));

		// store the login token on the user so it's easy to find for API calls.
		this.loginToken = token;
	}

	async addFavorite(story) {
		this.favorites.push(story);
		await this._updateFavorite('add', story);
	}

	async removeFavorite(story) {
		this.favorites = this.favorites.filter(s => s.storyId !=  story.storyId);
		await this._updateFavorite('remove', story); 
	}

	async _updateFavorite(newState, story) {
		const method = newState === 'add' ? 'POST' : 'DELETE'
		const token = this.loginToken;
		if (!token) return;

		await axios ({
			url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
			method: method,
			data: {token} 
		});
	}

	isFavorite(story) {
		return this.favorites.some(s => (s.storyId === story.storyId))
	}

	/** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

	static async signup (username, password, name) {
		const response = await axios({
			url    : `${BASE_URL}/signup`,
			method : 'POST',
			data   : { user: { username, password, name } }
		});

		let { user } = response.data;

		return new User(
			{
				username   : user.username,
				name       : user.name,
				createdAt  : user.createdAt,
				favorites  : user.favorites,
				ownStories : user.stories
			},
			response.data.token
		);
	}

	/** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

	static async login (username, password) {
		const response = await axios({
			url    : `${BASE_URL}/login`,
			method : 'POST',
			data   : { user: { username, password } }
		});

		let { user } = response.data;

		return new User(
			{
				username   : user.username,
				name       : user.name,
				createdAt  : user.createdAt,
				favorites  : user.favorites,
				ownStories : user.stories
			},
			response.data.token
		);
	}

	/** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

	static async loginViaStoredCredentials (token, username) {
		try {
			const response = await axios({
				url    : `${BASE_URL}/users/${username}`,
				method : 'GET',
				params : { token }
			});

			let { user } = response.data;

			return new User(
				{
					username   : user.username,
					name       : user.name,
					createdAt  : user.createdAt,
					favorites  : user.favorites,
					ownStories : user.stories
				},
				token
			);
		} catch (err) {
			console.error('loginViaStoredCredentials failed', err);
			return null;
		}
	}
}


// // async addStory(user, newStoryData) {
//     const reqBody = {
// 		token: user.loginToken,
// 		story: {
// 		  ...newStoryData
// 		}
// 	  }
  
  
// 	  const res = await axios.post(`${BASE_URL}/stories`, reqBody)
  
// 	  // add to new story to all stories & user's own stories
// 	  const story = new Story(res.data.story);
// 	  this.stories.push(story);
// 	  user.ownStories.push(story);
// 	  //make sure that story returns an instance of the Story class
// 	  console.log(story instanceof Story) // true
// 	  return story;
// 	} //

// async function getUsers (token) {
// 	const res = await axios.get('https://hack-or-snooze-v3.herokuapp.com/users', { params: { token } });
// 	console.log(res);
// }

// async function signUp (username, password, name) {
// 	const res = await axios.post('https://hack-or-snooze-v3.herokuapp.com/signup', {
// 		user: { name, username, password }
// 	});
// 	console.log(res);
// }
// signUp('DaveyDev', 'Lemontea123', 'Davey Developer')
// token with Space _-_ : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IiBEYXZleURldiIsImlhdCI6MTY1MzA2NDc4N30.Nrobu97cOgYOQvtVx4c_HQ6jvDIF4kSAQSAcltsfELA
// use non space token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkRhdmV5RGV2IiwiaWF0IjoxNjUzMDg3NjgwfQ.QurD27KvcIEE0SoRcffPMYGPs1xrpC3mAzl527AFmaU

// async function login (username, password) {
// 	const res = await axios.post('https://hack-or-snooze-v3.herokuapp.com/login', { user: { username, password } });
// 	console.log(res);
// 	// console.log(res.data.token);
// 	return res.data.token;
// }
// login('DaveyDev', 'Lemontea123')

// async function getUsersWithAuth() {
//   const token = await login('DaveyDev', 'Lemontea123')
//   // console.log(token)
//   getUsers(token)
// }
// // getUsersWithAuth()