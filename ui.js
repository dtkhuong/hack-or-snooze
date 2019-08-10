$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $favoritedArticles = $("#favorited-articles");
  const $myStoriesList = $("#my-articles");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $mainNavLinks = $(".main-nav-links");
  const $navUsername = $("#nav-welcome");
  const $navUserProfile = $("#nav-user-profile");
  const $navMyStories = $("#nav-my-stories");
  const $profileContainer = $("#user-profile");
  const $profileName = $("#profile-name");
  const $profileUsername = $("#profile-username");
  const $profileDate = $("#profile-account-date");
  const $navSubmit = $("#nav-submit");
  const $navFavorites = $("#nav-favorites");
  const $author = $("#author");
  const $title = $("#title");
  const $url = $("#url");


  // const $storySubmit = $("#story-submit");

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await checkIfLoggedIn();
    await generateStories();
    await generateFavorites();
    $allStoriesList.show();
    $profileContainer.hide();
  });

  /**
   * Event handler for showing only user profile info section
   */

  $navUserProfile.on("click", function () {
    hideElements();
  });

  /**
   * Event handler for showing new article submit form
   */

  $navSubmit.on("click", function () {
    $allStoriesList.show();
    $submitForm.show('slow', 'linear');
  });

  /**
   * Event handler for showing favorites page for user
   */
  $navFavorites.on("click", async function() {
    
    await checkIfLoggedIn();
    await generateStories();
    await generateFavorites();
    $favoritedArticles.show();
    $profileContainer.hide();
  });

  /**
   * Event handler for showing stories page for user
   */
  $navMyStories.on("click", async function() {
    
    await checkIfLoggedIn();
    await generateStories();
    await generateFavorites();
    await generateMyStories();

    $myStoriesList.show();
    $profileContainer.hide();
    $favoritedArticles.hide();
  });

  /**
   * Event handler for submitting the story form
   */

  $submitForm.on("submit", async function (evt) {
    evt.preventDefault();
    let newStoryObj = {
      author: $author.val(),
      title: $title.val(),
      url: $url.val()
    }
    let storyResponse = await storyList.addStory(currentUser, newStoryObj);
    const result = generateStoryHTML(storyResponse.data.story);
    $allStoriesList.prepend(result);
    // currentUser.ownStories.push(storyResponse);
    console.log("currentUser is ", currentUser);
    $submitForm.hide('slow', 'linear');
  });


  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser(currentUser);
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    let favoritesList = currentUser.favorites;
  
    // await generateFavorites();
    $allStoriesList.show();
    // $profileContainer.hide();
    // $favoritedArticles.hide();
    // update our global variable
    storyList = storyListInstance;
    
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      
      let isFav = isStoryInFavList(story,favoritesList);
      
      const result = generateStoryHTML(story, isFav);
      $allStoriesList.append(result);
    }
    /**
     * Event handler for adding or removing a favorite
     */
    const $icon = $("i");
    $icon.on("click", function () {
      // check if user clicks an unchecked star.
      const starId = $(this).closest('li').attr('id');
      // console.log("Star ID is: ", starId)
      let unstarred = $(this).hasClass("far");
      if(unstarred) {
        $(this).removeClass("far").addClass("fas");
        
      } else {
        $(this).removeClass("fas").addClass("far");
        
      }
      currentUser.toggleFavorites(starId, unstarred);
    })
  }

  function isStoryInFavList(story, favoritesList){
    for (let i = 0; i < favoritesList.length; i++){
      if (story.storyId === favoritesList[i].storyId){
        return true;
      }
    }
    return false;
  }

  async function generateFavorites() {
    // const favoritesListInstance = await currentUser.toggleFavorites(storyId, unstarred)
    hideElements();
    // await generateStories();
    

    // empty out that part of the page
    $allStoriesList.hide();
    $favoritedArticles.empty();

    // loop through all of our stories and generate HTML for them
    for (let favorite of currentUser.favorites) {
      const $result = generateFavoriteHTML(favorite);
      $favoritedArticles.append($result);
    }
    $favoritedArticles.show();


     /**
     * Event handler for adding or removing a favorite
     */
    const $icon = $("i");
    $icon.on("click", async function () {
      // check if user clicks an unchecked star.
      const starId = $(this).closest('li').attr('id');
      // console.log("Star ID is: ", starId)
      let unstarred = $(this).hasClass("far");
      if(unstarred) {
        $(this).removeClass("far").addClass("fas");
        // console.log("Toggled add star")
      } else {
        $(this).removeClass("fas").addClass("far");
        // console.log("Toggled remove star")
      }
      await currentUser.toggleFavorites(starId, unstarred);
      // $favoritedArticles.empty();
      // $favoritedArticles.show();
    })
  }

  //function
  async function generateMyStories() {
    hideElements();
    // await generateStories();
    console.log("Has been clicked")
    // empty out that part of the page
    $allStoriesList.hide();
    $myStoriesList.empty();
    console.log("Current user stories: ", currentUser.ownStories)
    // loop through all of our stories and generate HTML for them
    for (let myStory of currentUser.ownStories) {

      let isFav = isStoryInFavList(myStory,currentUser.favorites);

      const $result = generateUserStoryHTML(myStory, isFav);
      $myStoriesList.append($result);
      console.log($result)
    }
    $myStoriesList.show();
    // Right now only getting listener on star - not trash can
    const $icon = $("i");
    $icon.on("click", async function () {
      // check if user clicks an unchecked star.
      const starId = $(this).closest('li').attr('id');
      // console.log("Star ID is: ", starId)
      let unstarred = $(this).hasClass("far");
      if(unstarred) {
        $(this).removeClass("far").addClass("fas");
        // console.log("Toggled add star")
      } else {
        $(this).removeClass("fas").addClass("far");
        // console.log("Toggled remove star")
      }
      await currentUser.toggleFavorites(starId, unstarred);
      // $favoritedArticles.empty();
      // $favoritedArticles.show();
    })
  }

   /**
   * A function to render HTML for an individual Favorite instance
   */

  function generateFavoriteHTML(story) {
    let hostName = getHostName(story.url);
    let starClass = "fas";
    // if (story has been favorited by user){
    //   starClass = "fas";
    // }
    // console.log('story is ', story);
    // render favorite markup
    const favoriteMarkup = $(`
      <li id="${story.storyId}">
        <span class="star">
          <i class="${starClass} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    return favoriteMarkup;
  }

  /**
   * A function to render HTML for an individual Favorite instance
   */

  function generateUserStoryHTML(story, isFav) {
    let hostName = getHostName(story.url);
    let iconClass = "far";
    // if (story has been favorited by user){
    //   starClass = "fas";
    // }
    // console.log('story is ', story);

    if (isFav){iconClass = "fas"}
    // render favorite markup
    const favoriteMarkup = $(`
      <li id="${story.storyId}">
        <span class="trash-can">
          <i class="fas fa-trash-alt"></i>
        </span>
        <span class="star">
          <i class="${iconClass} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    return favoriteMarkup;
  }


  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story, isFav) {
    let hostName = getHostName(story.url);
    let iconClass = "far";
    if (isFav){iconClass = "fas"}
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <span class="star">
          <i class="${iconClass} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser(userObj) {
    let date = userObj.createdAt.split("T");

    $navLogin.hide();
    $navLogOut.show();
    $mainNavLinks.removeClass("hidden");
    $navUsername.show();
    $navUserProfile.html(userObj.username);
    $profileName.html(`Name: ${userObj.name}`);
    $profileUsername.html(`Username: ${userObj.username}`);
    $profileDate.html(`Account Created: ${date[0]}`);
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
