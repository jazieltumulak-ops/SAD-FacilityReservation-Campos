let allReservations = [];


// LOAD RESERVATIONS
async function loadReservations() {

    const body =
        document.getElementById(
            "reservationsTableBody"
        );


    if (!body) return;


    let query =
        supabaseClient
            .from("reservations")
            .select(`
                *,
                facilities (
                    facility_name,
                    location
                )
            `)
            .order(
                "reservation_date",
                {
                    ascending: false
                }
            );


    const { data, error } =
        await query;


    if (error) {

        console.error(error);

        body.innerHTML = `
            <tr>
                <td colspan="7"
                    class="table-message">

                    Unable to load reservations.

                </td>
            </tr>
        `;

        return;

    }


    let reservations =
        data || [];


    // REQUESTER ONLY SEES OWN
    if (
        currentProfile?.role ===
        "Requester"
    ) {

        reservations =
            reservations.filter(
                reservation =>
                    reservation.requester_id ===
                    currentUser.id
            );

    }


    allReservations =
        reservations;


    renderReservations(
        reservations
    );

}


// RENDER
function renderReservations(
    reservations
) {

    const body =
        document.getElementById(
            "reservationsTableBody"
        );


    if (!body) return;


    if (!reservations.length) {

        body.innerHTML = `
            <tr>
                <td colspan="7"
                    class="table-message">

                    No reservations found.

                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        reservations
            .map(
                reservation =>
                    createReservationRow(
                        reservation
                    )
            )
            .join("");

}


// ROW
function createReservationRow(
    reservation
) {

    const role =
        currentProfile?.role;


    let actions = "—";


    // REQUESTER
    if (
        role === "Requester" &&
        reservation.requester_id ===
            currentUser.id &&
        reservation.status ===
            "Pending"
    ) {

        actions = `
            <button
                class="mini-btn cancel-btn"
                onclick="changeReservationStatus(
                    ${reservation.id},
                    'Cancelled'
                )">

                <i class="fa-solid fa-xmark"></i>
                Cancel

            </button>
        `;

    }


    // STAFF
    if (
        role === "Facility Staff"
    ) {

        if (
            reservation.status ===
                "Scheduled"
        ) {

            actions = `
                <button
                    class="mini-btn use-btn"
                    onclick="changeReservationStatus(
                        ${reservation.id},
                        'In Use'
                    )">

                    <i class="fa-solid fa-play"></i>
                    In Use

                </button>
            `;

        }


        if (
            reservation.status ===
                "In Use"
        ) {

            actions = `
                <button
                    class="mini-btn complete-btn"
                    onclick="changeReservationStatus(
                        ${reservation.id},
                        'Completed'
                    )">

                    <i class="fa-solid fa-check"></i>
                    Complete

                </button>
            `;

        }

    }


    // ADMIN
    if (
        role === "Administrator" &&
        reservation.status === "Pending"
    ) {

        actions = `
            <div class="action-group">

                <button
                    class="mini-btn approve-btn"
                    onclick="reviewReservation(
                        ${reservation.id},
                        'Approved'
                    )">

                    <i class="fa-solid fa-check"></i>

                </button>

                <button
                    class="mini-btn reject-btn"
                    onclick="reviewReservation(
                        ${reservation.id},
                        'Rejected'
                    )">

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>
        `;

    }


    return `
        <tr>

            <td>
                <strong>
                    ${escapeHtml(
                        reservation
                            .facilities
                            ?.facility_name ||
                        "Unknown"
                    )}
                </strong>
            </td>


            <td>
                ${escapeHtml(
                    reservation.requester_id
                )}
            </td>


            <td>
                ${formatDate(
                    reservation.reservation_date
                )}
            </td>


            <td>
                ${formatTime(
                    reservation.start_time
                )}
                –
                ${formatTime(
                    reservation.end_time
                )}
            </td>


            <td>
                ${escapeHtml(
                    reservation.purpose
                )}
            </td>


            <td>
                <span
                    class="status-badge status-${statusClass(
                        reservation.status
                    )}">

                    ${escapeHtml(
                        reservation.status
                    )}

                </span>
            </td>


            <td>
                ${actions}
            </td>

        </tr>
    `;

}


// OPEN MODAL
function openReservationModal() {

    if (
        currentProfile?.role !==
        "Requester"
    ) {

        alert(
            "Only Requesters can submit reservation requests."
        );

        return;

    }


    const date =
        document.getElementById(
            "reservationDate"
        );


    if (date) {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        date.min = today;

    }


    document
        .getElementById(
            "reservationModal"
        )
        ?.classList.add("show");

}


window.openReservationModal =
    openReservationModal;


// CLOSE MODAL
function closeReservationModal() {

    document
        .getElementById(
            "reservationModal"
        )
        ?.classList.remove("show");


    document
        .getElementById(
            "reservationForm"
        )
        ?.reset();


    const message =
        document.getElementById(
            "reservationMessage"
        );


    if (message) {

        message.textContent = "";

        message.className =
            "form-message";

    }

}


window.closeReservationModal =
    closeReservationModal;


// SUBMIT RESERVATION
document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById(
                "reservationForm"
            )
            ?.addEventListener(
                "submit",
                submitReservation
            );

    }
);


async function submitReservation(
    event
) {

    event.preventDefault();


    if (
        currentProfile?.role !==
        "Requester"
    ) {

        return;

    }


    const message =
        document.getElementById(
            "reservationMessage"
        );


    const facilityId =
        Number(
            document
                .getElementById(
                    "reservationFacility"
                )
                .value
        );


    const date =
        document
            .getElementById(
                "reservationDate"
            )
            .value;


    const start =
        document
            .getElementById(
                "startTime"
            )
            .value;


    const end =
        document
            .getElementById(
                "endTime"
            )
            .value;


    const purpose =
        document
            .getElementById(
                "reservationPurpose"
            )
            .value
            .trim();


    if (
        !facilityId ||
        !date ||
        !start ||
        !end ||
        !purpose
    ) {

        showMessage(
            message,
            "Please complete all fields.",
            "error"
        );

        return;

    }


    // BR-B4-02
    if (start >= end) {

        showMessage(
            message,
            "Start time must be earlier than end time.",
            "error"
        );

        return;

    }


    const facility =
        allFacilities.find(
            item =>
                item.id ===
                facilityId
        );


    // BR-B4-01
    if (
        !facility ||
        facility.status !==
            "Active"
    ) {

        showMessage(
            message,
            "Only active facilities may be reserved.",
            "error"
        );

        return;

    }


    // BR-B4-08
    if (
        facility.status ===
            "Maintenance"
    ) {

        showMessage(
            message,
            "Facilities under Maintenance cannot be reserved.",
            "error"
        );

        return;

    }


    if (
        facility.condition ===
            "Poor"
    ) {

        showMessage(
            message,
            "This facility is currently unavailable.",
            "error"
        );

        return;

    }


    try {

        // CHECK CONFLICT
        const { data: conflicts, error } =
            await supabaseClient
                .from("reservations")
                .select(
                    "id,start_time,end_time,status"
                )
                .eq(
                    "facility_id",
                    facilityId
                )
                .eq(
                    "reservation_date",
                    date
                )
                .in(
                    "status",
                    [
                        "Approved",
                        "Scheduled",
                        "In Use"
                    ]
                );


        if (error) {

            throw error;

        }


        const conflict =
            (conflicts || [])
                .some(
                    reservation =>

                        start <
                            reservation.end_time &&

                        end >
                            reservation.start_time

                );


        // BR-B4-03
        if (conflict) {

            showMessage(
                message,
                "Schedule conflict detected. Please choose another time.",
                "error"
            );

            return;

        }


        // INSERT
        const { data, error: insertError } =
            await supabaseClient
                .from("reservations")
                .insert({

                    facility_id:
                        facilityId,

                    requester_id:
                        currentUser.id,

                    purpose:
                        purpose,

                    reservation_date:
                        date,

                    start_time:
                        start,

                    end_time:
                        end,

                    status:
                        "Pending"

                })
                .select()
                .single();


        if (insertError) {

            throw insertError;

        }


        await writeAudit(
            "Reservation Submitted",
            "reservations",
            data.id,
            `Reservation for ${facility.facility_name}`
        );


        showMessage(
            message,
            "Reservation submitted successfully. Status: Pending.",
            "success"
        );


        await loadReservations();

        await loadDashboardStats();

        await loadApprovals();


        setTimeout(
            closeReservationModal,
            800
        );


    } catch (error) {

        console.error(error);

        showMessage(
            message,
            error.message ||
                "Unable to submit reservation.",
            "error"
        );

    }

}


// APPROVALS
async function loadApprovals() {

    const body =
        document.getElementById(
            "approvalsTableBody"
        );


    if (!body) return;


    if (
        currentProfile?.role !==
        "Administrator"
    ) {

        return;

    }


    const { data, error } =
        await supabaseClient
            .from("reservations")
            .select(`
                *,
                facilities (
                    facility_name
                )
            `)
            .eq(
                "status",
                "Pending"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        body.innerHTML = `
            <tr>
                <td colspan="7"
                    class="table-message">

                    Unable to load approvals.

                </td>
            </tr>
        `;

        return;

    }


    if (!data?.length) {

        body.innerHTML = `
            <tr>
                <td colspan="7"
                    class="table-message">

                    No pending reservation requests.

                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        data
            .map(
                reservation =>
                    `

                    <tr>

                        <td>
                            ${escapeHtml(
                                reservation.requester_id
                            )}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    reservation
                                        .facilities
                                        ?.facility_name ||
                                    "Unknown"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${formatDate(
                                reservation.reservation_date
                            )}
                        </td>

                        <td>
                            ${formatTime(
                                reservation.start_time
                            )}
                            –
                            ${formatTime(
                                reservation.end_time
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                reservation.purpose
                            )}
                        </td>

                        <td>
                            <span
                                class="status-badge status-pending">

                                Pending

                            </span>
                        </td>

                        <td>

                            <div class="action-group">

                                <button
                                    class="mini-btn approve-btn"
                                    onclick="reviewReservation(
                                        ${reservation.id},
                                        'Approved'
                                    )">

                                    <i class="fa-solid fa-check"></i>
                                    Approve

                                </button>


                                <button
                                    class="mini-btn reject-btn"
                                    onclick="reviewReservation(
                                        ${reservation.id},
                                        'Rejected'
                                    )">

                                    <i class="fa-solid fa-xmark"></i>
                                    Reject

                                </button>

                            </div>

                        </td>

                    </tr>

                    `
            )
            .join("");

}


// REVIEW
async function reviewReservation(
    id,
    decision
) {

    if (
        currentProfile?.role !==
        "Administrator"
    ) {

        return;

    }


    const action =
        decision === "Approved"
            ? "approve"
            : "reject";


    if (
        !confirm(
            `Are you sure you want to ${action} this reservation?`
        )
    ) {

        return;

    }


    try {

        const { data: reservation, error } =
            await supabaseClient
                .from("reservations")
                .select("*")
                .eq("id", id)
                .single();


        if (error) {

            throw error;

        }


        if (
            decision ===
            "Approved"
        ) {

            // CHECK AGAIN BEFORE APPROVAL
            const { data: conflicts, error: conflictError } =
                await supabaseClient
                    .from("reservations")
                    .select(
                        "id,start_time,end_time,status"
                    )
                    .eq(
                        "facility_id",
                        reservation.facility_id
                    )
                    .eq(
                        "reservation_date",
                        reservation.reservation_date
                    )
                    .in(
                        "status",
                        [
                            "Approved",
                            "Scheduled",
                            "In Use"
                        ]
                    )
                    .neq(
                        "id",
                        id
                    );


            if (conflictError) {

                throw conflictError;

            }


            const conflict =
                (conflicts || [])
                    .some(
                        item =>

                            reservation.start_time <
                                item.end_time &&

                            reservation.end_time >
                                item.start_time

                    );


            if (conflict) {

                alert(
                    "Cannot approve. This reservation overlaps an approved schedule."
                );

                return;

            }

        }


        const newStatus =
            decision === "Approved"
                ? "Scheduled"
                : "Rejected";


        const { error: updateError } =
            await supabaseClient
                .from("reservations")
                .update({

                    status:
                        newStatus,

                    approved_by:
                        decision ===
                        "Approved"
                            ? currentUser.id
                            : null

                })
                .eq(
                    "id",
                    id
                );


        if (updateError) {

            throw updateError;

        }


        await writeAudit(
            decision === "Approved"
                ? "Reservation Approved"
                : "Reservation Rejected",

            "reservations",

            id,

            `Status changed to ${newStatus}`
        );


        await loadReservations();

        await loadApprovals();

        await loadDashboardStats();

        await loadAuditLogs();


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to update reservation."
        );

    }

}


window.reviewReservation =
    reviewReservation;


// CHANGE STATUS
async function changeReservationStatus(
    id,
    newStatus
) {

    const reservation =
        allReservations.find(
            item =>
                item.id === id
        );


    if (!reservation) return;


    // STAFF RULES
    if (
        currentProfile?.role ===
        "Facility Staff"
    ) {

        if (
            newStatus ===
                "In Use" &&
            reservation.status !==
                "Scheduled"
        ) {

            alert(
                "Only Scheduled reservations can be marked In Use."
            );

            return;

        }


        if (
            newStatus ===
                "Completed" &&
            reservation.status !==
                "In Use"
        ) {

            alert(
                "A reservation must be In Use before it can be Completed."
            );

            return;

        }

    }


    // REQUESTER RULE
    if (
        newStatus ===
            "Cancelled"
    ) {

        if (
            currentProfile?.role !==
                "Requester"
        ) {

            alert(
                "Only Requesters can cancel reservations."
            );

            return;

        }


        if (
            reservation.requester_id !==
                currentUser.id
        ) {

            alert(
                "You can only cancel your own reservation."
            );

            return;

        }


        if (
            reservation.status !==
                "Pending"
        ) {

            alert(
                "Only Pending reservations can be cancelled."
            );

            return;

        }

    }


    if (
        !confirm(
            `Change reservation status to ${newStatus}?`
        )
    ) {

        return;

    }


    try {

        const { error } =
            await supabaseClient
                .from("reservations")
                .update({
                    status:
                        newStatus
                })
                .eq(
                    "id",
                    id
                );


        if (error) {

            throw error;

        }


        await writeAudit(
            "Reservation Status Changed",
            "reservations",
            id,
            `Status changed to ${newStatus}`
        );


        await loadReservations();

        await loadDashboardStats();

        await loadAuditLogs();


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to update reservation."
        );

    }

}


window.changeReservationStatus =
    changeReservationStatus;


// AUDIT LOGS
async function loadAuditLogs() {

    if (
        currentProfile?.role !==
        "Administrator"
    ) {

        return;

    }


    const body =
        document.getElementById(
            "auditTableBody"
        );


    if (!body) return;


    const { data, error } =
        await supabaseClient
            .from("audit_logs")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(100);


    if (error) {

        console.error(error);

        body.innerHTML = `
            <tr>
                <td colspan="6"
                    class="table-message">

                    Unable to load audit logs.

                </td>
            </tr>
        `;

        return;

    }


    if (!data?.length) {

        body.innerHTML = `
            <tr>
                <td colspan="6"
                    class="table-message">

                    No audit records yet.

                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        data
            .map(
                log =>
                    `

                    <tr>

                        <td>
                            ${formatDateTime(
                                log.created_at
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                log.user_id
                            )}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    log.action
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                log.table_name
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                log.record_id ??
                                "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                log.details ||
                                "—"
                            )}
                        </td>

                    </tr>

                    `
            )
            .join("");

}


// STATUS CLASS
function statusClass(
    status = ""
) {

    return status
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );

}


// DATE
function formatDate(value) {

    if (!value) return "—";


    return new Date(
        `${value}T00:00:00`
    ).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// TIME
function formatTime(value) {

    if (!value) return "—";


    const [
        hour,
        minute
    ] =
        value.split(":");


    const date =
        new Date();


    date.setHours(
        Number(hour),
        Number(minute),
        0
    );


    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// DATE + TIME
function formatDateTime(value) {

    if (!value) return "—";


    return new Date(
        value
    ).toLocaleString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// MESSAGE
function showMessage(
    element,
    text,
    type
) {

    if (!element) return;


    element.textContent =
        text;


    element.className =
        `form-message ${type}`;

}