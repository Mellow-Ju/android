package com.example.myapplication.presentation.stocks.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.example.myapplication.domain.model.MarketType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StockAddBottomSheet(
    sheetState: SheetState,
    onDismiss: () -> Unit,
    onSave: (name: String, marketType: MarketType, ticker: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var ticker by remember { mutableStateOf("") }
    var selectedMarketType by remember { mutableStateOf(MarketType.FOREIGN) }
    var nameError by remember { mutableStateOf(false) }
    var tickerError by remember { mutableStateOf(false) }

    ModalBottomSheet(
        sheetState = sheetState,
        onDismissRequest = onDismiss
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(text = "종목 추가", style = androidx.compose.material3.MaterialTheme.typography.titleLarge)

            OutlinedTextField(
                value = name,
                onValueChange = { name = it; nameError = false },
                label = { Text("종목명") },
                placeholder = { Text("예: SCHD, 삼성전자") },
                isError = nameError,
                supportingText = if (nameError) ({ Text("종목명을 입력해주세요") }) else null,
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                modifier = Modifier.fillMaxWidth()
            )

            Column {
                Text(text = "구분", style = androidx.compose.material3.MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MarketType.entries.forEach { type ->
                        FilterChip(
                            selected = selectedMarketType == type,
                            onClick = { selectedMarketType = type },
                            label = { Text(type.label) }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = ticker,
                onValueChange = { ticker = it.uppercase(); tickerError = false },
                label = { Text("Ticker") },
                placeholder = { Text("예: SCHD, 005930") },
                isError = tickerError,
                supportingText = if (tickerError) ({ Text("Ticker를 입력해주세요") }) else null,
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                modifier = Modifier.fillMaxWidth()
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(onClick = onDismiss) { Text("취소") }
                Button(
                    onClick = {
                        nameError = name.isBlank()
                        tickerError = ticker.isBlank()
                        if (!nameError && !tickerError) {
                            onSave(name.trim(), selectedMarketType, ticker.trim())
                        }
                    }
                ) { Text("저장") }
            }
        }
    }
}
