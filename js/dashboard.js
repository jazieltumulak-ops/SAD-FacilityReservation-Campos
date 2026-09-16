document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);


async function initializeDashboard() {

    // LOGIN CHECK
    const user =
        await getSessionUser();


    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    currentUser = user;


    // GET PROFILE
    const { data: profile, error } =
        await supabaseClient
            .from("profiles")
            .select("id, full_name, role")
            .eq("id", user.id)
            .single();


    if (error || !profile) {

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

        return;
    }


    currentProfile = profile;


    setupUserInterface();

    setupNavigation();

    setupButtons();

    await loadFacilities();

    await loadReservations();

    await loadDashboardStats();

    await loadApprovals();

    await loadAuditLogs();

}


// USER UI
function setupUserInterface() {

    const name =
        currentProfile.full_name || "User";

    const role =
        currentProfile.role || "Requester";


    setText(
        "welcomeName",
        name
    );


    setText(
        "sidebarUserName",
        name
    );


    setText(
        "sidebarUserRole",
        role
    );


    const initials =
        name
            .split(" ")
            .map(word => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();


    setText(
        "sidebarAvatar",
        initials
    );


    setText(
        "headerAvatar",
        initials
    );


    // ROLE ACCESS
    document
        .querySelectorAll(".admin-only")
        .forEach(element => {

            element.style.display =
                role === "Administrator"
                    ? ""
                    : "none";

        });


    document
        .querySelectorAll(".requester-only")
        .forEach(element => {

            element.style.display =
                role === "Requester"
                    ? ""
                    : "none";

        });


    // FACILITY STAFF CAN SEE RESERVATIONS
    if (role === "Facility Staff") {

        document
            .querySelectorAll(".requester-only")
            .forEach(element => {

                element.style.display = "none";

            });

    }

}


// NAVIGATION
function setupNavigation() {

    document
        .querySelectorAll(".menu-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    const section =
                        this.dataset.section;

                    showSection(section);

                }
            );

        });


    const mobileMenu =
        document.getElementById(
            "mobileMenuBtn"
        );


    mobileMenu?.addEventListener(
        "click",
        () => {

            document
                .getElementById("sidebar")
                ?.classList.toggle("open");

        }
    );


    document
        .getElementById("logoutBtn")
        ?.addEventListener(
            "click",
            logoutUser
        );

}


function showSection(sectionId) {

    document
        .querySelectorAll(".page-section")
        .forEach(section => {

            section.classList.remove("active");

        });


    const target =
        document.getElementById(sectionId);


    if (!target) return;


    target.classList.add("active");


    document
        .querySelectorAll(".menu-link")
        .forEach(link => {

            link.classList.remove("active");

            if (
                link.dataset.section === sectionId
            ) {

                link.classList.add("active");

            }

        });


    const names = {

        dashboardSection: "Dashboard",

        facilitiesSection: "Facilities",

        reservationsSection: "Reservations",

        approvalsSection: "Approvals",

        auditSection: "Audit Logs"

    };


    setText(
        "pageHeading",
        names[sectionId] || "Dashboard"
    );


    document
        .getElementById("sidebar")
        ?.classList.remove("open");


    // REFRESH SECTION
    if (sectionId === "facilitiesSection") {

        loadFacilities();

    }


    if (sectionId === "reservationsSection") {

        loadReservations();

    }


    if (sectionId === "approvalsSection") {

        loadApprovals();

    }


    if (sectionId === "auditSection") {

        loadAuditLogs();

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


window.showSection = showSection;


// BUTTONS
function setupButtons() {

    document
        .getElementById("newReservationBtn")
        ?.addEventListener(
            "click",
            openReservationModal
        );


    document
        .getElementById("addFacilityBtn")
        ?.addEventListener(
            "click",
            openFacilityModal
        );


    document
        .getElementById("closeFacilityModal")
        ?.addEventListener(
            "click",
            closeFacilityModal
        );


    document
        .getElementById("cancelFacilityBtn")
        ?.addEventListener(
            "click",
            closeFacilityModal
        );


    document
        .getElementById("closeReservationModal")
        ?.addEventListener(
            "click",
            closeReservationModal
        );


    document
        .getElementById("cancelReservationBtn")
        ?.addEventListener(
            "click",
            closeReservationModal
        );


    document
        .querySelectorAll(".modal")
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (event.target === modal) {

                        modal.classList.remove("show");

                    }

                }
            );

        });


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                document
                    .querySelectorAll(".modal.show")
                    .forEach(modal => {

                        modal.classList.remove(
                            "show"
                        );

                    });

            }

        }
    );

}


// STATISTICS
async function loadDashboardStats() {

    try {

        const { count: total } =
            await supabaseClient
                .from("facilities")
                .select("*", {
                    count: "exact",
                    head: true
                });


        const { count: active } =
            await supabaseClient
                .from("facilities")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("status", "Active");


        let pendingQuery =
            supabaseClient
                .from("reservations")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("status", "Pending");


        let approvedQuery =
            supabaseClient
                .from("reservations")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .in(
                    "status",
                    [
                        "Approved",
                        "Scheduled",
                        "In Use"
                    ]
                );


        if (
            currentProfile.role === "Requester"
        ) {

            pendingQuery =
                pendingQuery.eq(
                    "requester_id",
                    currentUser.id
                );


            approvedQuery =
                approvedQuery.eq(
                    "requester_id",
                    currentUser.id
                );

        }


        const { count: pending } =
            await pendingQuery;


        const { count: approved } =
            await approvedQuery;


        setText(
            "totalFacilities",
            total || 0
        );


        setText(
            "activeFacilities",
            active || 0
        );


        setText(
            "pendingReservations",
            pending || 0
        );


        setText(
            "approvedReservations",
            approved || 0
        );


        // badge should only show admin pending count
        if (
            currentProfile.role ===
            "Administrator"
        ) {

            setText(
                "approvalBadge",
                pending || 0
            );

        }

    } catch (error) {

        console.error(
            "Dashboard statistics:",
            error
        );

    }

}


// HELPERS
function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


// AUTO REFRESH
setInterval(
    () => {

        if (
            !document.hidden &&
            currentUser
        ) {

            loadDashboardStats();

        }

    },
    30000
);