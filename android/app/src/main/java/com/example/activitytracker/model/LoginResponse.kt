package com.example.activitytracker.model

data class LoginResponse(
    val token: String,
    val user: User
)