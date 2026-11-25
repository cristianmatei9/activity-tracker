package com.example.activitytracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.activitytracker.ui.screens.ActivityDetailScreen
import com.example.activitytracker.ui.screens.ActivityEditScreen
import com.example.activitytracker.ui.screens.ActivityListScreen
import com.example.activitytracker.ui.screens.LoginScreen
import com.example.activitytracker.ui.theme.ActivityTrackerTheme
import com.example.activitytracker.viewmodel.ActivityViewModel

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()

        setContent {
            ActivityTrackerTheme {
                ActivityTrackerApp()
            }
        }
    }
}

@Composable
fun ActivityTrackerApp(
    viewModel: ActivityViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    val user = state.user

    if (user == null) {
        Scaffold(
            modifier = Modifier.fillMaxSize()
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                LoginScreen(
                    isLoading = state.isLoading,
                    error = state.error,
                    onLogin = viewModel::login
                )
            }
        }
    } else {
        val navController = rememberNavController()

        NavHost(
            navController = navController,
            startDestination = "activities"
        ) {
            composable("activities") {

                LaunchedEffect(Unit) {
                    viewModel.loadActivities()
                }

                ActivityListScreen(
                    username = user.username,
                    activities = state.activities,
                    isLoading = state.isLoading,
                    error = state.error,
                    onActivityClick = { id ->
                        navController.navigate("detail/$id")
                    },
                    onAdd = {
                        navController.navigate("add")
                    },
                    onRefresh = viewModel::loadActivities,
                    onLogout = viewModel::logout
                )
            }

            composable(
                route = "detail/{id}",
                arguments = listOf(
                    navArgument("id") {
                        type = NavType.IntType
                    }
                )
            ) { backStackEntry ->

                val id = backStackEntry.arguments
                    ?.getInt("id") ?: 0

                LaunchedEffect(id) {
                    viewModel.loadActivity(id)
                }

                ActivityDetailScreen(
                    activity = state.selectedActivity
                        ?.takeIf { it.id == id },
                    isLoading = state.isLoading,
                    error = state.error,
                    onBack = {
                        navController.popBackStack()
                    },
                    onEdit = { activityId ->
                        navController.navigate(
                            "edit/$activityId"
                        )
                    }
                )
            }

            composable("add") {

                LaunchedEffect(Unit) {
                    viewModel.prepareNewActivity()
                }

                ActivityEditScreen(
                    activity = state.selectedActivity
                        ?.takeIf { it.id == 0 },
                    isNew = true,
                    isLoading = state.isLoading,
                    error = state.error,
                    onSave = { activity ->
                        viewModel.saveActivity(activity) {
                            navController.popBackStack(
                                "activities",
                                inclusive = false
                            )
                        }
                    },
                    onBack = {
                        navController.popBackStack()
                    }
                )
            }

            composable(
                route = "edit/{id}",
                arguments = listOf(
                    navArgument("id") {
                        type = NavType.IntType
                    }
                )
            ) { backStackEntry ->

                val id = backStackEntry.arguments
                    ?.getInt("id") ?: 0

                LaunchedEffect(id) {
                    viewModel.loadActivity(id)
                }

                ActivityEditScreen(
                    activity = state.selectedActivity
                        ?.takeIf { it.id == id },
                    isNew = false,
                    isLoading = state.isLoading,
                    error = state.error,
                    onSave = { activity ->
                        viewModel.saveActivity(activity) {
                            navController.popBackStack(
                                "activities",
                                inclusive = false
                            )
                        }
                    },
                    onBack = {
                        navController.popBackStack()
                    }
                )
            }
        }

        BackHandler(enabled = state.isLoading) {

        }
    }
}