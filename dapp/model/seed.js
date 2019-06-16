const File = require("./file");

// campgrounds
const files = [
    {
        fileName: "file29",
        file: "Receipt3241.pdf",
        note: "Bill for consultation on 2018-11-15 11:00",
        shared: false
    },
    {
        fileName: "file30",
        file: "Reimbursement3323.pdf",
        note: "Reimbursment of bill 02031230",
        shared: false
    },
    {
        fileName: "file31",
        file: "HealthRecord.pdf",
        note: "Electronic prescription",
        shared: false
    },
    {
        fileName: "file32",
        file: "Laboratory3904.pdf",
        note: "Lab results ordered by Ferris, John MD",
        shared: false
    },
    {
        fileName: "file33",
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