let allFacilities = [];


// INITIAL EVENTS
document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById("facilitySearch")
            ?.addEventListener(
                "input",
                filterFacilities
            );


        document
            .getElementById("facilityStatusFilter")
            ?.addEventListener(
                "change",
                filterFacilities
            );


        document
            .getElementById("facilityForm")
            ?.addEventListener(
                "submit",
                addFacility
            );

    }
);


// LOAD FACILITIES
async function loadFacilities() {

    const { data, error } =
        await supabaseClient
            .from("facilities")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        renderFacilities(
            [],
            "Unable to load facilities."
        );

        return;

    }


    allFacilities = data || [];


    renderFacilities(
        allFacilities
    );


    renderDashboardFacilities();

    populateReservationFacilities(
        allFacilities
    );

}


// DASHBOARD FACILITIES
function renderDashboardFacilities() {

    const container =
        document.getElementById(
            "dashboardFacilities"
        );


    if (!container) return;


    const facilities =
        allFacilities
            .filter(
                facility =>
                    facility.status === "Active"
            )
            .slice(0, 3);


    if (!facilities.length) {

        container.innerHTML = `
            <div class="empty-box">
                <i class="fa-solid fa-building"></i>
                <p>No active facilities available.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        facilities
            .map(
                facility =>
                    createFacilityCard(
                        facility,
                        false
                    )
            )
            .join("");

}


// FACILITY LIST
function renderFacilities(
    facilities,
    message = "No facilities found."
) {

    const container =
        document.getElementById(
            "facilityList"
        );


    if (!container) return;


    if (!facilities.length) {

        container.innerHTML = `
            <div class="empty-box">
                <i class="fa-solid fa-building"></i>
                <p>${escapeHtml(message)}</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        facilities
            .map(
                facility =>
                    createFacilityCard(
                        facility,
                        true
                    )
            )
            .join("");

}


// FACILITY CARD
function createFacilityCard(
    facility,
    full = false
) {

    const icon =
        getFacilityIcon(
            facility.category
        );


    const condition =
        (
            facility.condition ||
            "Good"
        ).toLowerCase();


    const adminDelete =
        full &&
        currentProfile?.role ===
            "Administrator";


    return `

        <article class="facility-card">

            <div class="facility-cover">

                <i class="${icon}"></i>

                <span class="facility-status">
                    ${escapeHtml(
                        facility.status
                    )}
                </span>

            </div>


            <div class="facility-body">

                <h3>
                    ${escapeHtml(
                        facility.facility_name
                    )}
                </h3>


                <div class="facility-meta">

                    <span>
                        <i class="fa-solid fa-location-dot"></i>
                        ${escapeHtml(
                            facility.location
                        )}
                    </span>

                    <span>
                        <i class="fa-solid fa-users"></i>
                        ${escapeHtml(
                            facility.capacity
                        )}
                    </span>

                </div>


                <div class="facility-footer">

                    <span
                        class="condition ${condition}">

                        <i class="fa-solid fa-circle"></i>

                        ${escapeHtml(
                            facility.condition ||
                            "Good"
                        )}

                    </span>


                    ${
                        adminDelete
                            ? `
                                <button
                                    class="mini-btn delete-btn"
                                    onclick="deleteFacility(${facility.id})">

                                    <i class="fa-solid fa-trash"></i>
                                    Delete

                                </button>
                              `
                            : ""
                    }

                </div>

            </div>

        </article>

    `;

}


// ICON
function getFacilityIcon(category = "") {

    const value =
        category.toLowerCase();


    if (value.includes("lab")) {

        return "fa-solid fa-computer";

    }


    if (
        value.includes("gym") ||
        value.includes("sport")
    ) {

        return "fa-solid fa-dumbbell";

    }


    if (value.includes("hall")) {

        return "fa-solid fa-people-group";

    }


    if (
        value.includes("room") ||
        value.includes("class")
    ) {

        return "fa-solid fa-chalkboard";

    }


    if (value.includes("library")) {

        return "fa-solid fa-book";

    }


    return "fa-solid fa-building";

}


// SEARCH
function filterFacilities() {

    const search =
        (
            document.getElementById(
                "facilitySearch"
            )?.value || ""
        ).toLowerCase();


    const status =
        document.getElementById(
            "facilityStatusFilter"
        )?.value || "";


    const filtered =
        allFacilities.filter(
            facility => {

                const text = `
                    ${facility.facility_name}
                    ${facility.category}
                    ${facility.location}
                `.toLowerCase();


                return (
                    text.includes(search) &&
                    (
                        !status ||
                        facility.status === status
                    )
                );

            }
        );


    renderFacilities(filtered);

}


// OPEN FACILITY MODAL
function openFacilityModal() {

    if (
        currentProfile?.role !==
        "Administrator"
    ) {

        return;

    }


    document
        .getElementById("facilityModal")
        ?.classList.add("show");

}


window.openFacilityModal =
    openFacilityModal;


// CLOSE FACILITY MODAL
function closeFacilityModal() {

    document
        .getElementById("facilityModal")
        ?.classList.remove("show");


    document
        .getElementById("facilityForm")
        ?.reset();


    const message =
        document.getElementById(
            "facilityMessage"
        );


    if (message) {

        message.textContent = "";

        message.className =
            "form-message";

    }

}


window.closeFacilityModal =
    closeFacilityModal;


// ADD FACILITY
async function addFacility(event) {

    event.preventDefault();


    if (
        currentProfile?.role !==
        "Administrator"
    ) {

        return;

    }


    const message =
        document.getElementById(
            "facilityMessage"
        );


    const payload = {

        facility_name:
            document
                .getElementById(
                    "facilityName"
                )
                .value
                .trim(),

        category:
            document
                .getElementById(
                    "facilityCategory"
                )
                .value
                .trim(),

        location:
            document
                .getElementById(
                    "facilityLocation"
                )
                .value
                .trim(),

        capacity:
            Number(
                document
                    .getElementById(
                        "facilityCapacity"
                    )
                    .value
            ),

        condition:
            document
                .getElementById(
                    "facilityCondition"
                )
                .value,

        status:
            document
                .getElementById(
                    "facilityStatus"
                )
                .value

    };


    try {

        const { data, error } =
            await supabaseClient
                .from("facilities")
                .insert(payload)
                .select()
                .single();


        if (error) {

            throw error;

        }


        await writeAudit(
            "Facility Added",
            "facilities",
            data.id,
            `Added ${payload.facility_name}`
        );


        message.textContent =
            "Facility added successfully.";

        message.className =
            "form-message success";


        await loadFacilities();

        await loadDashboardStats();


        setTimeout(
            closeFacilityModal,
            700
        );


    } catch (error) {

        console.error(error);

        message.textContent =
            error.message ||
            "Unable to add facility.";

        message.className =
            "form-message error";

    }

}


// DELETE
async function deleteFacility(id) {

    if (
        currentProfile?.role !==
        "Administrator"
    ) {

        return;

    }


    const facility =
        allFacilities.find(
            item => item.id === id
        );


    if (
        !confirm(
            `Delete "${facility?.facility_name}"?`
        )
    ) {

        return;

    }


    try {

        const { error } =
            await supabaseClient
                .from("facilities")
                .delete()
                .eq("id", id);


        if (error) {

            throw error;

        }


        await writeAudit(
            "Facility Deleted",
            "facilities",
            id,
            `Deleted ${facility?.facility_name || id}`
        );


        await loadFacilities();

        await loadDashboardStats();


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to delete facility."
        );

    }

}


window.deleteFacility =
    deleteFacility;


// RESERVATION FACILITY OPTIONS
function populateReservationFacilities(
    facilities
) {

    const select =
        document.getElementById(
            "reservationFacility"
        );


    if (!select) return;


    const available =
        facilities.filter(
            facility =>
                facility.status ===
                    "Active" &&
                facility.condition !==
                    "Poor"
        );


    select.innerHTML =
        `
        <option value="">
            Select facility
        </option>
        ` +
        available
            .map(
                facility =>
                    `
                    <option value="${facility.id}">
                        ${escapeHtml(
                            facility.facility_name
                        )}
                        —
                        ${escapeHtml(
                            facility.location
                        )}
                    </option>
                    `
            )
            .join("");

}


// AUDIT
async function writeAudit(
    action,
    tableName,
    recordId,
    details
) {

    if (!currentUser) return;


    const { error } =
        await supabaseClient
            .from("audit_logs")
            .insert({

                user_id:
                    currentUser.id,

                action:
                    action,

                table_name:
                    tableName,

                record_id:
                    recordId,

                details:
                    details

            });


    if (error) {

        console.error(
            "Audit log error:",
            error
        );

    }

}


window.writeAudit =
    writeAudit;


// ESCAPE HTML
function escapeHtml(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => ({

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"

        }[character])
    );

}