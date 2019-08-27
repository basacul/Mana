const User = require('./user');
const File = require("./file");

// users
const users = [
    {
        username: 'Alice',
        password: 'alice'
    },
    {
        username: 'Bob',
        password: 'bob'
    },
    {
        username: 'Charlie',
        password: 'charlie'
    }
]
/**
 * INCLUDE 3 DIFFERENT USERS WITH EACH HAVING A DIFFERENT SET OF FILES
 */
User.deleteMany({}, function (err) {
    if (err) {
        console.log('could not delete all users in seed.js file', err);
    } else {
        console.log("users successfully removed");

        users.forEach(function (user) {
            User.register(new User({ username: user.username }), user.password, function (err, newUser) {
                if (err) {
                    console.log(`Error on registering for ${user}`);
                    console.log(err);
                } else {
                    console.log('New user created', newUser);
                }
            });
        });
    }
});

// files
const files = [
    {
        filename: "file29",
        file: "Receipt3241.pdf",
        note: "Bill for consultation on 2018-11-15 11:00",
        shared: false
    },
    {
        filename: "file30",
        file: "Reimbursement3323.pdf",
        note: "Reimbursment of bill 02031230",
        shared: false
    },
    {
        filename: "file31",
        file: "HealthRecord.pdf",
        note: "Electronic prescription",
        shared: false
    },
    {
        filename: "file32",
        file: "Laboratory3904.pdf",
        note: "Lab results ordered by Ferris, John MD",
        shared: false
    },
    {
        filename: "file33",
        file: "Receipt_0329.pdf",
        note: "Bill for consultation on 2019-03-02 10:15",
        shared: false
    }
];

function seedDatabase() {

    //Remove all files
    File.deleteMany({}, function (err) {

        if (err) {
            console.log(err);
        } else {

            console.log("files successfully removed");

            // add given files from mock data
            files.forEach(function (file) {
                File.create(file, function (err, newFile) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("added a new file");
                    }
                });
            });

        }

    });
}

module.exports = seedDatabase;