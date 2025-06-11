import { PrismaClient } from '../generated/prisma/client.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const sampleVideoUrls = [
    "https://www.youtube.com/shorts/fmZa9eawePU",
    "https://www.youtube.com/shorts/Z8xZIT26VfY",
    "https://www.youtube.com/shorts/ygPgztCFDjw",
    "https://www.youtube.com/shorts/TVBuae5MXbI",

];

async function main() {
    console.log('Starting database seeding...');

    await prisma.$transaction([
        prisma.notification.deleteMany(),
        prisma.message.deleteMany(),
        prisma.groupMember.deleteMany(),
        prisma.chatGroup.deleteMany(),
        prisma.tagInComment.deleteMany(),
        prisma.tagInPost.deleteMany(),
        prisma.postHashtag.deleteMany(),
        prisma.hashtag.deleteMany(),
        prisma.commentLike.deleteMany(),
        prisma.comment.deleteMany(),
        prisma.postSave.deleteMany(),
        prisma.postLike.deleteMany(),
        prisma.postMedia.deleteMany(),
        prisma.post.deleteMany(),
        prisma.follow.deleteMany(),
        prisma.token.deleteMany(),
        prisma.notificationPreferences.deleteMany(),
        prisma.user.deleteMany(),
    ]);

    // Create Users
    const users = [];
    const passwordHash = await bcrypt.hash('test1234', 10);
    for (let i = 0; i < 50; i++) {
        const user = await prisma.user.create({
            data: {
                email: faker.internet.email(),
                username: faker.internet.username(),
                password: passwordHash,
                avatarUrl: faker.image.avatar(),
                bio: faker.lorem.sentence(),
                isActive: true,
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
            },
        });
        users.push(user);

        await prisma.notificationPreferences.create({
            data: {
                userId: user.id,
                notifyOnNewFollower: true,
                notifyOnPostLike: true,
                notifyOnPostComment: true,
                notifyOnCommentLike: true,
                notifyOnGroupMessage: true,
                notifyOnDirectMessage: true,
            },
        });
    }

    for (const follower of users) {
        const others = users.filter((u) => u.id !== follower.id);
        const followCount = Math.floor(Math.random() * 3) + 1;
        const toFollow = others.slice(0, followCount).sort(() => Math.random() - 0.5);
        for (const followed of toFollow) {
            await prisma.$transaction([
                prisma.follow.create({
                    data: {
                        followerId: follower.id,
                        followingId: followed.id,
                        createdAt: faker.date.recent(),
                    },
                }),
                prisma.user.update({
                    where: { id: follower.id },
                    data: { totalFollowing: { increment: 1 } },
                }),
                prisma.user.update({
                    where: { id: followed.id },
                    data: { totalFollowers: { increment: 1 } },
                }),
            ]);
        }
      }

    const posts = [];
    for (const user of users) {
        for (let i = 0; i < 2; i++) {
            const post = await prisma.post.create({
                data: {
                    userId: user.id,
                    content: faker.lorem.paragraph(),
                    visibility: ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'][Math.floor(Math.random() * 3)],
                    createdAt: faker.date.recent(),
                    updatedAt: faker.date.recent(),
                },
            });
            posts.push(post);

            const isVideo = Math.random() < 0.3;
            if (isVideo) {
                await prisma.postMedia.create({
                    data: {
                        postId: post.id,
                        mediaUrl: sampleVideoUrls[Math.floor(Math.random() * sampleVideoUrls.length)],
                        mediaType: 'video',
                        order: 1,
                    },
                });
            } else {
                const imageCount = Math.floor(Math.random() * 4) + 1;
                for (let j = 0; j < imageCount; j++) {
                    await prisma.postMedia.create({
                        data: {
                            postId: post.id,
                            mediaUrl: faker.image.url(),
                            mediaType: 'image',
                            order: j + 1,
                        },
                    });
                }
            }
        }
    }

    const hashtags = [];
    for (let i = 0; i < 5; i++) {
        const hashtag = await prisma.hashtag.create({
            data: {
                tag: `#${faker.lorem.word()}`,
                usageCount: Math.floor(Math.random() * 10),
                createdAt: faker.date.recent(),
            },
        });
        hashtags.push(hashtag);
    }
    for (const post of posts) {
        const hashtag = hashtags[Math.floor(Math.random() * hashtags.length)];
        await prisma.postHashtag.create({
            data: {
                postId: post.id,
                hashtagId: hashtag.id,
            },
        });
    }

    for (const post of posts) {
        const commenter = users[Math.floor(Math.random() * users.length)];
        await prisma.$transaction([
            prisma.comment.create({
                data: {
                    postId: post.id,
                    userId: commenter.id,
                    content: faker.lorem.sentence(),
                    createdAt: faker.date.recent(),
                    updatedAt: faker.date.recent(),
                },
            }),
            prisma.post.update({
                where: { id: post.id },
                data: { commentCount: { increment: 1 } },
            }),
        ]);
    }
    
    for (const post of posts) {
        const likeCount = Math.floor(Math.random() * 4); // 0–3 likes per post
        const likers = users
            .filter((u) => u.id !== post.userId) // Exclude post owner
            .sort(() => Math.random() - 0.5)
            .slice(0, likeCount);
        for (const liker of likers) {
            await prisma.$transaction([
                prisma.postLike.create({
                    data: {
                        userId: liker.id,
                        postId: post.id,
                        createdAt: faker.date.recent(),
                    },
                }),
                prisma.post.update({
                    where: { id: post.id },
                    data: { likeCount: { increment: 1 } },
                }),
            ]);
        }
      }

    const chatGroups = [];
    for (let i = 0; i < 3; i++) {
        const owner = users[Math.floor(Math.random() * users.length)];
        const chatGroup = await prisma.chatGroup.create({
            data: {
                name: `${faker.lorem.word()} Group`,
                imageUrl: faker.image.url(),
                ownerId: owner.id,
                lastActivityAt: faker.date.recent(),
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent(),
            },
        });
        chatGroups.push(chatGroup);

        const members = [owner, ...users.filter((u) => u.id !== owner.id).sort(() => Math.random() - 0.5).slice(0, 3)];
        for (const member of members) {
            await prisma.groupMember.create({
                data: {
                    userId: member.id,
                    groupId: chatGroup.id,
                    isAdmin: member.id === owner.id,
                    joinedAt: faker.date.recent(),
                },
            });
        }

        for (let j = 0; j < 5; j++) {
            const sender = members[Math.floor(Math.random() * members.length)];
            await prisma.message.create({
                data: {
                    senderId: sender.id,
                    groupId: chatGroup.id,
                    content: faker.lorem.sentence(),
                    isRead: Math.random() > 0.5,
                    createdAt: faker.date.recent(),
                },
            });
        }
    }

    for (let i = 0; i < 5; i++) {
        const sender = users[Math.floor(Math.random() * users.length)];
        const receiver = users.filter((u) => u.id !== sender.id)[Math.floor(Math.random() * (users.length - 1))];
        await prisma.message.create({
            data: {
                senderId: sender.id,
                receiverId: receiver.id,
                content: faker.lorem.sentence(),
                isRead: Math.random() > 0.5,
                createdAt: faker.date.recent(),
            },
        });
    }

    for (const user of users) {
        const actor = users.filter((u) => u.id !== user.id)[Math.floor(Math.random() * (users.length - 1))];
        const post = posts[Math.floor(Math.random() * posts.length)];
        await prisma.notification.create({
            data: {
                userId: user.id,
                actorId: actor.id,
                type: 'POST_LIKE',
                postId: post.id,
                isRead: Math.random() > 0.5,
                createdAt: faker.date.recent(),
            },
        });
    }

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });