package com.example.myapplication.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.automirrored.outlined.List
import androidx.compose.material.icons.outlined.PieChart
import androidx.compose.material.icons.outlined.SwapVert
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState

enum class AppRoute(val route: String, val label: String, val icon: ImageVector) {
    HOME("home", "홈", Icons.Outlined.Dashboard),
    TRADE("trade", "거래", Icons.Outlined.SwapVert),
    STOCKS("stocks", "종목", Icons.AutoMirrored.Outlined.List),
    PORTFOLIO("portfolio", "포트폴리오", Icons.Outlined.PieChart)
}

@Composable
fun BottomNavBar(navController: NavController) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    NavigationBar {
        AppRoute.entries.forEach { appRoute ->
            NavigationBarItem(
                selected = currentRoute == appRoute.route,
                onClick = {
                    navController.navigate(appRoute.route) {
                        popUpTo(AppRoute.HOME.route) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = { Icon(imageVector = appRoute.icon, contentDescription = appRoute.label) },
                label = { Text(appRoute.label) }
            )
        }
    }
}
