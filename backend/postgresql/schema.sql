create table _user (
    username text not null unique,
    password text not null,
    salt text not null,
    uuid text not null,
    primary key(uuid)
);

create table song (
    id serial,
    name text not null,
    author text not null,
    user_uuid text not null,
    created_at timestamptz default now(),
    primary key(id),
    unique(name, author)
);

create table vote (
    song_id int not null,
    user_uuid text not null,
    created_at timestamptz default now(),
    vote text not null check (vote='up' or vote='down'),
    primary key(song_id, user_uuid)
);

create table comment (
    uuid text not null,
    song_id int not null,
    user_uuid text not null,
    message text not null,
    reply_to text,
    created_at timestamptz not null default now(),
    primary key(uuid)
);

alter table comment
add foreign key (song_id) references song(id)
on update cascade on delete cascade;

alter table comment
add foreign key (user_uuid) references _user(uuid)
on update cascade on delete cascade;

alter table comment
add foreign key (reply_to) references comment(uuid)
on update cascade on delete cascade;

alter table song
add foreign key (user_uuid) references _user(uuid)
on update cascade on delete cascade;

alter table vote
add foreign key (user_uuid) references _user(uuid)
on update cascade on delete cascade;

alter table vote
add foreign key (song_id) references song(id)
on update cascade on delete cascade;