sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (
    Controller,
    JSONModel,
    MessageToast
) {
    "use strict";

    return Controller.extend(
        "animal.adoption.userdashboard.controller.Dashboard",
        {

            // =====================================================
            // INIT
            // =====================================================

            onInit: function () {

                var oDashboardModel = new JSONModel({
                    myApplications: 0,
                    pendingApplications: 0,
                    approvedApplications: 0
                });

                this.getView().setModel(
                    oDashboardModel,
                    "dashboard"
                );

                this._loadDashboardData();
                this._loadApplications();
            },


            // =====================================================
            // DASHBOARD STATISTICS
            // =====================================================

            _loadDashboardData: function () {

                var oDashboardModel =
                    this.getView().getModel("dashboard");

                fetch(
                    "/odata/v4/user-catalog/UserDashboardStats"
                )
                    .then(function (oResponse) {

                        if (!oResponse.ok) {
                            throw new Error(
                                "HTTP " + oResponse.status
                            );
                        }

                        return oResponse.json();
                    })
                    .then(function (oResult) {

                        console.log(
                            "User Dashboard response:",
                            oResult
                        );

                        if (
                            oResult.value &&
                            oResult.value.length > 0
                        ) {

                            var oData =
                                oResult.value[0];

                            oDashboardModel.setData({

                                myApplications:
                                    oData.myApplications || 0,

                                pendingApplications:
                                    oData.pendingApplications || 0,

                                approvedApplications:
                                    oData.approvedApplications || 0

                            });
                        }

                    })
                    .catch(function (oError) {

                        console.error(
                            "User Dashboard error:",
                            oError
                        );

                        MessageToast.show(
                            "Unable to load dashboard data"
                        );
                    });
            },


            // =====================================================
            // MY APPLICATIONS
            // Backend automatically filters by logged-in user
            // =====================================================

            _loadApplications: function () {

                var oModel = new JSONModel([]);

                this.getView().setModel(
                    oModel,
                    "applications"
                );

                fetch(
                    "/odata/v4/user-catalog/AdoptionApplicationsSrv"
                )
                    .then(function (oResponse) {

                        if (!oResponse.ok) {
                            throw new Error(
                                "HTTP " + oResponse.status
                            );
                        }

                        return oResponse.json();
                    })
                    .then(function (oResult) {

                        console.log(
                            "My Applications:",
                            oResult
                        );

                        oModel.setData(
                            oResult.value || []
                        );

                    })
                    .catch(function (oError) {

                        console.error(
                            "Applications Error:",
                            oError
                        );

                        MessageToast.show(
                            "Unable to load applications"
                        );
                    });
            },


            // =====================================================
            // REFRESH
            // =====================================================

            onRefresh: function () {

                this._loadDashboardData();
                this._loadApplications();

                MessageToast.show(
                    "Dashboard refreshed"
                );
            },


            // =====================================================
            // BACK
            // =====================================================

            onNavBack: function () {

                window.history.back();
            },


            // =====================================================
            // NAVIGATION
            // =====================================================

            onBrowseAnimalsPress: function () {

                window.location.href =
                    "/animal.adoption.useranimals/index.html";
            },

            onMyApplicationsPress: function () {

                window.location.href =
                    "/userapplications/index.html";
            },

            onMyAdoptionsPress: function () {

                window.location.href =
                    "/animal.adoption.useradoptions/index.html";
            },

            onProfilePress: function () {

                window.location.href =
                    "/animal.adoption.userprofile/index.html";
            }

        }
    );
});