package com.example.activitytracker.viewmodel

import com.example.activitytracker.model.Activity
import com.example.activitytracker.model.User

data class ActivityUiState(
    val user: User? = null,
    val activities: List<Activity> = emptyList(),
    val selectedActivity: Activity? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)