insert into _user (username, password, uuid) values (
    'andrea',
    'password',
    'c65263c3-dd8e-4d18-b18e-1f1d3d69c6c7'
);

insert into song (
    name,
    author,
    user_uuid
) values (
    'Barrio',
    'Mahmood',
    'c65263c3-dd8e-4d18-b18e-1f1d3d69c6c7'
), (
    'Mantieni il bacio',
    'Michele Bravi',
    'c65263c3-dd8e-4d18-b18e-1f1d3d69c6c7'
);

insert into vote (
   song_id,
   user_uuid,
   vote 
) values (
    (
        select id
        from song
        where name='Barrio' and author='Mahmood'
    ),
    'c65263c3-dd8e-4d18-b18e-1f1d3d69c6c7',
    'up'
)