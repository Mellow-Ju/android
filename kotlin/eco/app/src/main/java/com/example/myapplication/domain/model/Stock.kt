package com.example.myapplication.domain.model

data class Stock(
    val id: Long = 0,
    val name: String,
    val marketType: MarketType,
    val ticker: String
)

enum class MarketType(val label: String) {
    DOMESTIC("국내"),
    FOREIGN("해외");

    companion object {
        fun from(value: String) = entries.firstOrNull { it.label == value } ?: DOMESTIC
    }
}
