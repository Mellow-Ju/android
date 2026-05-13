package com.example.myapplication.domain.repository

import com.example.myapplication.domain.model.Stock
import io.reactivex.rxjava3.core.Completable
import io.reactivex.rxjava3.core.Observable

interface StockRepository {
    fun observeStocks(): Observable<List<Stock>>
    fun searchStocks(query: String): Observable<List<Stock>>
    fun addStock(stock: Stock): Completable
    fun deleteStock(id: Long): Completable
}
