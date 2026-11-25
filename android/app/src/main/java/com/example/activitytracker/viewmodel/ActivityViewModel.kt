package com.example.activitytracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.activitytracker.model.Activity
import com.example.activitytracker.repository.ActivityRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class ActivityViewModel : ViewModel() {

    private val repository = ActivityRepository()

    private val _uiState = MutableStateFlow(ActivityUiState())

    val uiState = _uiState.asStateFlow()

    fun login(username: String, password: String) {
        execute {
            val user = repository.login(username, password)

            _uiState.update {
                it.copy(user = user)
            }
        }
    }

    fun logout() {
        if (_uiState.value.isLoading) return

        repository.logout()
        _uiState.value = ActivityUiState()
    }

    fun loadActivities() {
        execute {
            val activities = repository.getActivities()

            _uiState.update {
                it.copy(activities = activities)
            }
        }
    }

    fun loadActivity(id: Int) {
        execute {
            _uiState.update {
                it.copy(selectedActivity = null)
            }

            val activity = repository.getActivity(id)

            _uiState.update {
                it.copy(selectedActivity = activity)
            }
        }
    }

    fun prepareNewActivity() {
        _uiState.update {
            it.copy(
                selectedActivity = Activity(),
                error = null
            )
        }
    }

    fun saveActivity(
        activity: Activity,
        onSuccess: () -> Unit
    ) {
        execute(onSuccess = onSuccess) {

            val savedActivity = if (activity.id == 0) {
                repository.createActivity(activity)
            } else {
                repository.updateActivity(activity)
            }

            _uiState.update {
                val activities = it.activities.toMutableList()

                val index = activities.indexOfFirst { item ->
                    item.id == savedActivity.id
                }

                if (index >= 0) {
                    activities[index] = savedActivity
                } else {
                    activities.add(savedActivity)
                }

                it.copy(
                    activities = activities,
                    selectedActivity = savedActivity
                )
            }
        }
    }

    fun clearError() {
        _uiState.update {
            it.copy(error = null)
        }
    }

    private fun execute(
        onSuccess: () -> Unit = {},
        action: suspend () -> Unit
    ) {
        if (_uiState.value.isLoading) return

        _uiState.update {
            it.copy(isLoading = true, error = null)
        }

        viewModelScope.launch {
            var success = false

            try {
                action()
                success = true
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        error = e.message ?: "Unknown error"
                    )
                }
            } finally {
                _uiState.update {
                    it.copy(isLoading = false)
                }
            }

            if (success) {
                onSuccess()
            }
        }
    }
}