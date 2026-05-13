package com.example.myapplication.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.myapplication.data.local.entity.StockEntity
import io.reactivex.rxjava3.core.Completable
import io.reactivex.rxjava3.core.Observable

@Dao
interface StockDao {

    @Query("SELECT * FROM stocks ORDER BY name ASC")
    fun observeAll(): Observable<List<StockEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insert(stock: StockEntity): Completable

    @Query("DELETE FROM stocks WHERE id = :id")
    fun deleteById(id: Long): Completable

    @Query("SELECT * FROM stocks WHERE name LIKE '%' || :query || '%' ORDER BY name ASC")
    fun search(query: String): Observable<List<StockEntity>>
}
