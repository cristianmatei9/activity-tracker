package com.example.activitytracker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.activitytracker.model.Activity

import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityEditScreen(
    activity: Activity?,
    isNew: Boolean,
    isLoading: Boolean,
    error: String?,
    onSave: (Activity) -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        if (isNew) {
                            "Add Activity"
                        } else {
                            "Edit Activity"
                        }
                    )
                },
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
            if (activity == null) {
                if (isLoading) {
                    CircularProgressIndicator()
                } else {
                    Text(
                        text = error ?: "Activity not found.",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            } else {
                ActivityForm(
                    activity = activity,
                    isLoading = isLoading,
                    error = error,
                    onSave = onSave
                )
            }
        }
    }
}

@Composable
private fun ActivityForm(
    activity: Activity,
    isLoading: Boolean,
    error: String?,
    onSave: (Activity) -> Unit
) {
    var title by remember(activity) {
        mutableStateOf(activity.title)
    }

    var description by remember(activity) {
        mutableStateOf(activity.description)
    }

    var date by remember(activity) {
        mutableStateOf(activity.date)
    }

    var duration by remember(activity) {
        mutableStateOf(
            if (activity.duration > 0) {
                activity.duration.toString()
            } else {
                ""
            }
        )
    }

    var completed by remember(activity) {
        mutableStateOf(activity.completed)
    }

    var location by remember(activity) {
        mutableStateOf(activity.location ?: "")
    }

    val durationValue = duration.toIntOrNull()

    val dateValid = isValidDate(date)

    val isValid = title.isNotBlank() &&
            dateValid &&
            durationValue != null &&
            durationValue > 0

    OutlinedTextField(
        value = title,
        onValueChange = { title = it },
        label = { Text("Title") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        enabled = !isLoading
    )

    Spacer(modifier = Modifier.height(16.dp))

    OutlinedTextField(
        value = description,
        onValueChange = { description = it },
        label = { Text("Description") },
        modifier = Modifier.fillMaxWidth(),
        minLines = 3,
        enabled = !isLoading
    )

    Spacer(modifier = Modifier.height(16.dp))

    OutlinedTextField(
        value = date,
        onValueChange = { date = it },
        label = { Text("Date (YYYY-MM-DD)") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        enabled = !isLoading,
        isError = date.isNotEmpty() && !dateValid,
        supportingText = {
            if (date.isNotEmpty() && !dateValid) {
                Text("Enter a valid date (YYYY-MM-DD)")
            }
        }
    )

    Spacer(modifier = Modifier.height(16.dp))

    OutlinedTextField(
        value = duration,
        onValueChange = { duration = it },
        label = { Text("Duration (minutes)") },
        modifier = Modifier.fillMaxWidth(),
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.Number
        ),
        singleLine = true,
        enabled = !isLoading,
        isError = duration.isNotEmpty() &&
                (durationValue == null || durationValue <= 0)
    )

    Spacer(modifier = Modifier.height(16.dp))

    OutlinedTextField(
        value = location,
        onValueChange = { location = it },
        label = { Text("Location") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        enabled = !isLoading
    )

    Spacer(modifier = Modifier.height(16.dp))

    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(
            checked = completed,
            onCheckedChange = { completed = it },
            enabled = !isLoading
        )

        Text("Completed")
    }

    Spacer(modifier = Modifier.height(24.dp))

    Button(
        onClick = {
            val updatedActivity = activity.copy(
                title = title.trim(),
                description = description.trim(),
                date = date.trim(),
                duration = duration.toInt(),
                completed = completed,
                location = location.trim()
                    .takeIf { it.isNotEmpty() }
            )

            onSave(updatedActivity)
        },
        modifier = Modifier.fillMaxWidth(),
        enabled = isValid && !isLoading
    ) {
        Text("Save Activity")
    }

    if (isLoading) {
        Spacer(modifier = Modifier.height(16.dp))

        CircularProgressIndicator()
    }

    if (error != null) {
        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = error,
            color = MaterialTheme.colorScheme.error
        )
    }
}

private fun isValidDate(date: String): Boolean {
    if (!date.matches(Regex("[0-9]{4}-[0-9]{2}-[0-9]{2}"))) {
        return false
    }

    return try {
        val formatter = SimpleDateFormat(
            "yyyy-MM-dd",
            Locale.ROOT
        )

        formatter.isLenient = false
        formatter.parse(date) != null
    } catch (e: java.text.ParseException) {
        false
    }
}