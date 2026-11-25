package com.example.activitytracker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.activitytracker.model.Activity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityDetailScreen(
    activity: Activity?,
    isLoading: Boolean,
    error: String?,
    onBack: () -> Unit,
    onEdit: (Int) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Activity Details") },
                navigationIcon = {
                    TextButton(
                        onClick = onBack,
                        enabled = !isLoading
                    ) {
                        Text("Back")
                    }
                }
            )
        }
    ) { padding ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator()
            } else if (error != null) {
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error
                )
            } else if (activity != null) {

                Text(
                    text = activity.title,
                    style = MaterialTheme.typography.headlineMedium
                )

                Spacer(modifier = Modifier.height(24.dp))

                DetailField(
                    label = "Description",
                    value = activity.description
                )

                DetailField(
                    label = "Date",
                    value = activity.date
                )

                DetailField(
                    label = "Duration",
                    value = "${activity.duration} minutes"
                )

                DetailField(
                    label = "Status",
                    value = if (activity.completed) {
                        "Completed"
                    } else {
                        "Pending"
                    }
                )

                DetailField(
                    label = "Location",
                    value = activity.location
                        ?.takeIf { it.isNotBlank() }
                        ?: "Not specified"
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = { onEdit(activity.id) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Edit Activity")
                }
            } else {
                Text("Activity not found.")
            }
        }
    }
}

@Composable
private fun DetailField(
    label: String,
    value: String
) {
    Text(
        text = label,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary
    )

    Spacer(modifier = Modifier.height(4.dp))

    Text(
        text = value,
        style = MaterialTheme.typography.bodyLarge
    )

    Spacer(modifier = Modifier.height(20.dp))
}