package com.example.activitytracker.repository

import com.example.activitytracker.api.RetrofitClient
import com.example.activitytracker.model.Activity
import com.example.activitytracker.model.LoginRequest
import com.example.activitytracker.model.User

class ActivityRepository {

    private val api = RetrofitClient.api

    private var token: String? = null

    suspend fun login(username: String, password: String): User {
        val response = api.login(
            LoginRequest(username, password)
        )

        token = response.token

        return response.user
    }

    fun logout(){
        token = null
    }

    private fun authorization(): String {
        val currentToken = token
            ?: throw IllegalStateException("User is not authenticated")

        return "Bearer $currentToken"
    }

    suspend fun getActivities(): List<Activity> {
        return api.getActivities(authorization())
    }

    suspend fun getActivity(id: Int): Activity {
        return api.getActivity(authorization(), id)
    }

    suspend fun createActivity(activity: Activity): Activity {
        return api.createActivity(authorization(), activity)
    }

    suspend fun updateActivity(activity: Activity): Activity {
        return api.updateActivity(
            authorization(),
            activity.id,
            activity
        )
    }
}