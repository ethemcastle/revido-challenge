# Video Demo Transcript

## Part 1 — Feature Walkthrough

**0:00** – Hello everyone, I'm Etienne, and this is my project. Here we sign in. Check the email. Send the link.

**0:16** – We log in. Manage competitors. For the moment we have Paracel.com and Stripe.com.

**0:32** – If we want, let's remove Paracel. We go to Paracel.com. Click here. Go to Paracel.

**0:57** – And test notes. We add it. And here we add it. We can edit it. And if we scan, it does the processing — pending. It goes and takes the data.

**1:14** – If we scan again, it does it again. There's the notes. Give it some notes.

**1:23** – Let's try Stripe. Yes. This rearranged. Here we can do compare — two snapshots. And here we find that we have these differences. Or side by side — this is red and this is green.

**1:55** – Yep, this is the only hiccup — because when I deploy on my worker, I had a problem. When I send the magic link email, it doesn't redirect to the correct URL. It goes to some internal Docker link that I couldn't figure out on time how to redirect to the correct path.

**2:24** – But in the email link, if you click it, the authentication is okay — only the redirection is wrong.

**2:54** – So it works fine, but only the redirection the first time you redirect. When you go directly to a link like `/competitors`, it will automatically be logged in.

**3:06** – I chose a monorepo architecture and separated them into small apps — `web` and `worker`. Here we put all the workers, and here we put all the web (frontend). This is all the processes that happen on the worker side.

**3:38** – Here we are in Railway. I separated them into two services: `worker`, which is pointed to the worker folder, and `web`, which is pointed to the web folder — with variables configured for each. Deployments all okay.

**4:19** – Let's go to the database. Public tables: competitors, snapshots, snapshot_notes, workspaces, workspace_members. Yep, that's mostly it.

**4:49** – Hope you like it. Thank you very much. Bye.

## Part 2 — Scope & Prioritization

**0:00** – Also I forgot to mention that I cut multi-workspace, user avatars/display names, pagination for large lists, error retry logic in the worker, and unit/integration tests.

**0:24** – Scheduled scanning and email notifications are out of scope per the brief. The way I structured the issues is in features — the first four features were the most important ones, like showing the UI, editing the content, and the competitors.

**1:04** – After those, I moved on to Features 5–7, which were the workers running in the background.

**1:17** – That was an important one too. And after that, I found I had some time left, so I added the implementation of snapshot diffs and the notes.

**1:36** – Yeah. Thank you very much.
