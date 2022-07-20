insert into _user (username, password, salt, uuid) values (
    'andrea',
    'bee145052b9b6881f86c27d5d0ee254d018229ede2f320bf8f32da638387f63d',
    '4a78f63ee31d48bd5ebe77ca',
    'c65263c3-dd8e-4d18-b18e-1f1d3d69c6c7'
);

insert into _user (username, password, salt, uuid) values (
    'matthew',
    'b440011a6d2eaa2b5f44884ebeac80cf1ac3d3e7609f5ae56377bc1a6a323e97',
    '4a78f63ae31d48bffefe77ca',
    'c652ffc3-dd8e-4d18-b18e-1f1d3d69c6c7'
);

insert into _user (username, password, salt, uuid) values (
    'luca',
    '61008f2380a7ad0fe7efc8ef4642e45838c8ebb915b4f246666f43306f4ec838',
    '5d78f63ae31d48bffcbf33bb',
    'c652ffc3-dd8e-4d18-b18e-1f1d3d69c6c7'
);

insert into _user (username, password, salt, uuid) values (
    'alessandro',
    '4cae84bad7bccb3cbacef79aec3d7c64c519c1cf0426e0a3dd1af2969ddb1ace',
    'ff78f6baff1d48bffefe77ca',
    'c652ffc3-dd8e-4d18-b18e-1f1d3d69c6c7'
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