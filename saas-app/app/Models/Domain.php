<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Domain extends Model
{
    use HasFactory, SoftDeletes;

    public $table = "domains";

    /**
     * Write code on Method
     *
     * @return response()
     */
    protected $fillable = [
        'domain',
        'token',
    ];

    /**
     * Write code on Method
     *
     * @return response()
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Write code on Method
     *
     * @return response()
     */
    public function documents()
    {
        return $this->hasMany(Document::class, 'domain', 'domain');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'domain', 'domain');
    }

    public function roles()
    {
        return $this->hasMany(Role::class, 'domain', 'domain');
    }
}
