const cds = require("@sap/cds");

module.exports = cds.service.impl(async function () {

    const {
        AnimalsSrv,
        AdoptionApplicationsSrv,
        AdoptionsSrv,
        HealthRecordsSrv,
        SheltersSrv,
        UsersSrv
    } = this.entities;

        // ==========================================================
    // CURRENT USER: find (or create) the Users row for the login
    // ==========================================================

    const getCurrentUserID = async (req) => {

        // With XSUAA, req.user.id is the login email
        const email =
            (req.user.attr?.email || req.user.id).toLowerCase();

        const user = await SELECT.one
            .from(UsersSrv)
            .columns("ID")
            .where({ email });

        if (user) {
            return user.ID;
        }

        // First login: create the adopter profile (FR-USR-001)
        const ID = cds.utils.uuid();

        await INSERT.into(UsersSrv).entries({
            ID,
            firstName: req.user.attr?.givenName || "",
            lastName: req.user.attr?.familyName || "",
            email,
            role: "ADOPTER",
            status: "ACTIVE",
            createdAt: new Date(),
            modifiedAt: new Date()
        });

        return ID;
    };
    // ==========================================================
    // APPLY FOR ADOPTION
    // ==========================================================

    this.on("applyForAdoption", async (req) => {

        try {

            const animalID = req.params[0].ID;

            const {
                reasonForAdoption,
                housingDetails,
                petExperience
            } = req.data;


            // --------------------------------------------------
            // SAMPLE USER ID
            // Later this will come from authentication.
            // --------------------------------------------------

            const applicantID =
                await getCurrentUserID(req);


            // --------------------------------------------------
            // Check animal exists
            // --------------------------------------------------

            const animal = await SELECT.one
                .from(AnimalsSrv)
                .where({
                    ID: animalID
                });


            if (!animal) {
                return req.error(
                    404,
                    "Animal not found"
                );
            }


            // --------------------------------------------------
            // Check animal availability
            // --------------------------------------------------

            if (animal.animalStatus !== "AVAILABLE") {

                return req.error(
                    400,
                    "This animal is not available for adoption."
                );

            }


            // --------------------------------------------------
            // Prevent duplicate active application
            // --------------------------------------------------

            const existingApplication =
                await SELECT.one
                    .from(AdoptionApplicationsSrv)
                    .where({
                        animal_ID: animalID,
                        applicant_ID: applicantID
                    });


            if (existingApplication) {

                return req.error(
                    400,
                    "You have already submitted an application for this animal."
                );

            }


            // --------------------------------------------------
            // Create application
            // --------------------------------------------------

            const applicationData = {

                animal_ID: animalID,

                applicant_ID: applicantID,

                applicationDate: new Date(),

                reasonForAdoption:
                    reasonForAdoption,

                housingDetails:
                    housingDetails,

                petExperience:
                    petExperience,

                status: "UNDER_REVIEW",

                createdAt: new Date(),

                modifiedAt: new Date()
            };


            await INSERT
                .into(AdoptionApplicationsSrv)
                .entries(applicationData);


            // --------------------------------------------------
            // Return created application
            // --------------------------------------------------

            const createdApplication =
                await SELECT.one
                    .from(AdoptionApplicationsSrv)
                    .where({
                        animal_ID: animalID,
                        applicant_ID: applicantID
                    })
                    .orderBy({
                        createdAt: "desc"
                    });


            return createdApplication;


        } catch (error) {

            console.error(
                "Apply for Adoption Error:",
                error
            );

            return req.error(
                500,
                error.message
            );
        }

    });


    // ==========================================================
    // USER DASHBOARD STATISTICS
    // ==========================================================

    this.on(
        "READ",
        "UserDashboardStats",
        async (req) => {

            const USER_ID =
                await getCurrentUserID(req);


            const myApplications =
                await SELECT.one
                    .from(AdoptionApplicationsSrv)
                    .where({
                        applicant_ID: USER_ID
                    })
                    .columns`count(*) as count`;


            const pendingApplications =
                await SELECT.one
                    .from(AdoptionApplicationsSrv)
                    .where({
                        applicant_ID: USER_ID,
                        status: "UNDER_REVIEW"
                    })
                    .columns`count(*) as count`;


            const approvedApplications =
                await SELECT.one
                    .from(AdoptionApplicationsSrv)
                    .where({
                        applicant_ID: USER_ID,
                        status: "APPROVED"
                    })
                    .columns`count(*) as count`;


            return [{

                ID: "USER_DASHBOARD",

                myApplications:
                    Number(myApplications.count || 0),

                pendingApplications:
                    Number(pendingApplications.count || 0),

                approvedApplications:
                    Number(approvedApplications.count || 0)

            }];

        }
    );

    this.on("READ", "AdoptionsSrv", async (req) => {

    const USER_ID =
        await getCurrentUserID(req);

    const applications = await SELECT
        .from(AdoptionApplicationsSrv)
        .where({
            applicant_ID: USER_ID
        })
        .columns("ID");

    if (!applications.length) {
        return [];
    }

    const applicationIDs =
        applications.map(app => app.ID);

    return await SELECT
        .from(AdoptionsSrv)
        .where({
            application_ID: { in: applicationIDs }
        });
});

    this.on("READ", "AdoptionApplicationsSrv", async (req) => {

    const USER_ID =
        await getCurrentUserID(req);

    return await SELECT
        .from(AdoptionApplicationsSrv)
        .where({
            applicant_ID: USER_ID
        });
});


    this.on("READ", "UsersSrv", async (req) => {

    const USER_ID =
        await getCurrentUserID(req);

    return await SELECT
        .from(UsersSrv)
        .where({
            ID: USER_ID
        });
});

    this.on("editProfile", async (req) => {

    const USER_ID =
        await getCurrentUserID(req);

    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        city,
        state,
        postalCode
    } = req.data;

    await UPDATE(UsersSrv)
        .set({
            firstName,
            lastName,
            email,
            phoneNumber,
            address,
            city,
            state,
            postalCode,
            modifiedAt: new Date()
        })
        .where({
            ID: USER_ID
        });

    return await SELECT.one
        .from(UsersSrv)
        .where({
            ID: USER_ID
        });
});

});