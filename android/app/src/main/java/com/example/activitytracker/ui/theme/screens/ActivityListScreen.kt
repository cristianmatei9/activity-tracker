package com.example.activitytracker.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.activitytracker.model.Activity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityListScreen(
    username: String,
    activities: List<Activity>,
    isLoading: Boolean,
    error: String?,
    onActivityClick: (Int) -> Unit,
    onAdd: () -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Activities") },
                actions = {
                    TextButton(
                        onClick = onRefresh,
                        enabled = !isLoading
                    ) {
                        Text("Refresh")
                    }

                    TextButton(
                        onClick = onLogout,
                        enabled = !isLoading
                    ) {
                        Text("Logout")
                    }
                }
            )
        },
        floatingActionButton = {
            if (!isLoading) {
                FloatingActionButton(onClick = onAdd) {
                    Text("+")
                }
            }
        }
    ) { padding ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                text = "Welcome, $username!",
                style = MaterialTheme.typography.titleLarge
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (isLoading) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))
            }

            if (error != null) {
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error
                )

                Spacer(modifier = Modifier.height(16.dp))
            }

            if (activities.isEmpty() &&
                !isLoading && error == null
            ) {
                Text("No activities found.")
            }

            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(bottom = 80.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(
                    items = activities,
                    key = { it.id }
                ) { activity ->

                    ActivityListItem(
                        activity = activity,
                        enabled = !isLoading,
                        onClick = {
                            onActivityClick(activity.id)
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun ActivityListItem(
    activity: Activity,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(
                enabled = enabled,
                onClick = onClick
            )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = activity.title,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.weight(1f)
                )

                Text(
                    text = if (activity.completed) {
                        "Completed"
                    } else {
                        "Pending"
                    },
                    color = if (activity.completed) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.secondary
                    }
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text("Date: ${activity.date}")
            Text("Duration: ${activity.duration} min")
        }
    }
}