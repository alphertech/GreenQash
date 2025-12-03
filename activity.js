// Initialize Supabase
const supabaseUrl = 'https://ntjltxbpnjcwfzwegtct.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50amx0eGJwbmpjd2Z6d2VndGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTQ3MTcsImV4cCI6MjA2NzgzMDcxN30.AHV1vIOL6QcRkHEWnTgnpg6zf0UBD1-HFuxIvU3vbag'
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const activitiesTable = document.querySelector('#admin-section table tbody');
const refreshBtn = document.getElementById('refresh-activities');

// Format time to AM/PM
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Create activity row
function createActivityRow(activity) {
    const row = document.createElement('tr');

    row.innerHTML = `
    <td>${formatTime(activity.created_at)}</td>
    <td>${activity.username}</td>
    <td>${activity.activity_type}</td>
    <td>${activity.activity_details}</td>
    <td>
      <button 
        class="btn btn-primary btn-sm review-activity" 
        data-activity-id="${activity.id}"
        data-status="${activity.status}"
      >
        ${activity.status === 'pending' ? 'Review' : 'View'}
      </button>
    </td>
  `;

    return row;
}

// Fetch and display activities
async function loadActivities() {
    try {
        const { data: activities, error } = await supabase
            .from('user_activities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Clear existing rows
        activitiesTable.innerHTML = '';

        // Add new rows
        activities.forEach(activity => {
            activitiesTable.appendChild(createActivityRow(activity));
        });

        // Add event listeners to buttons
        document.querySelectorAll('.review-activity').forEach(btn => {
            btn.addEventListener('click', () => handleReview(btn.dataset.activityId));
        });

    } catch (err) {
        console.error('Error loading activities:', err);
        activitiesTable.innerHTML = '<tr><td colspan="5">Error loading activities</td></tr>';
    }
}

// Handle review button click
function handleReview(activityId) {
    // Implement your review logic here
    console.log('Reviewing activity:', activityId);
    alert(`Reviewing activity ${activityId}`);
}

// Set up real-time updates
function setupRealtimeActivities() {
    return supabase
        .channel('activities_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'user_activities'
            },
            () => loadActivities()
        )
        .subscribe();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadActivities();

    // Set up real-time listener
    const subscription = setupRealtimeActivities();

    // Refresh button
    refreshBtn?.addEventListener('click', loadActivities);

    // Clean up
    window.addEventListener('beforeunload', () => {
        supabase.removeChannel(subscription);
    });
});