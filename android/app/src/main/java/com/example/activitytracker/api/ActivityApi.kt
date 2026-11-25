package com.example.activitytracker.api

import com.example.activitytracker.model.Activity
import com.example.activitytracker.model.LoginRequest
import com.example.activitytracker.model.LoginResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface ActivityApi {

    @POST("login")
    suspend fun login(
        @Body request: LoginRequest
    ): LoginResponse

    @GET("activities")
    suspend fun getActivities(
        @Header("Authorization") authorization: String
    ): List<Activity>

    @GET("activities/{id}")
    suspend fun getActivity(
        @Header("Authorization") authorization: String,
        @Path("id") id: Int
    ): Activity

    @POST("activities")
    suspend fun createActivity(
        @Header("Authorization") authorization: String,
        @Body activity: Activity
    ): Activity

    @PUT("activities/{id}")
    suspend fun updateActivity(
        @Header("Authorization") authorization: String,
        @Path("id") id: Int,
        @Body activity: Activity
    ): Activity

}