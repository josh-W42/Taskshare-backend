# TaskSare: A Productivity Web Application

## About:
TaskShare is a full stack web application built using the MERN stack. It allows teams to communicate by text in real-time and delegate routine tasks.

For this application I was very inpired by other productivity/communication applications like Slack and GroupMe.

# User Stories:

## Authentication:

  * Every person that wants to access a workspace needs to be signed in and "invited" to it by reaching a specific route by browser.
  
  * However, if the user wants to demo the site, I'll make a demo workspace.

  A non-authentication user can:

  - Demo TaskShare in the demo workspace.
  - Sign up for an account.
  - Log in to their account.

  An authenticated user can:

  - Logout of their account.
  - Edit their account information.
  - Delete their account.

## Within a Workspace.

  * In workspaces, a user's role is either a member or admin.

  ** Some functions can only occur if the user has permission.

  A member can:

  - Create a new workspace.
  - Join public rooms.
  - Invite others to public rooms.
  - Join a private room by invite.
  - Create a public room.**
  - Post in a room.**
  - Reply to a post.**
  - Make Tasks.**
  - Edit / Delete Tasks.**
  - Direct Message user(s).
  - Edit / Delete their own posts.

  An Admin can:

  - Do the same as members but don't require permissions.
  - Delete posts / comments that they don't own.
  - Create private rooms and invite other users.
  - Edit the Workspace.

# Technical Hurdles:

## Real-Time:
- The main challenge with this application is integrating the real-time functionality of this app.
- I plan on using the socket.io npm package, that way I can facilitate communication between connected sockets.
- Additionally, by using socket.io's rooms, I can broadcast events to specific users that are connected to that room.

## Material-UI:
- I'm learning how to use material-ui for this project.
- I'm enjoying it so far, but using it effectively will prove to be challenge.

## Markdown:
- I also had an idea to use a lightweight markdown parser and compiler from [marked](https://marked.js.org/).
- I would use this to parse new posts/comments and preview them before posting.
- It would be an interesting challenge to implement this as well but only if there's enough time.

# API Documentation:
Published with [Postman](https://documenter.getpostman.com/view/5760839/TzCS4Qpp)

# Wireframes:
![Work space wireframe](./readme_assets/workspace.png)
** I spent some time working on a figma wireframe but this prototype is more accurate to what I had in mind.

# Data Models and ERD:

![Data models and relations](./readme_assets/TS_TaskShare.png)
