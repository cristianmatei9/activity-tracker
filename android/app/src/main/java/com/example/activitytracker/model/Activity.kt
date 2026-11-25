package com.example.activitytracker.model

data class Activity(
    val id: Int = 0,
    val title: String = "",
    val description: String = "",
    val date: String = "",
    val duration: Int = 0,
    val completed: Boolean = false,
    val location: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val photo: String? = null
)